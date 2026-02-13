/**
 * Lock manager for preventing concurrent instance edits across tabs
 */

import type { IDBPDatabase } from 'idb';
import type { UIStudioDB, LockRecord } from '../idb/database';
import type { LockMessage, LockStatus } from './types';

const LOCK_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const PING_INTERVAL = 30 * 1000; // 30 seconds

export class LockManager {
  private channel: BroadcastChannel;
  private tabId: string;
  private heldLocks: Set<string>;
  private pingInterval: number | null;
  private messageHandlers: Map<string, (message: LockMessage) => void>;

  constructor(private db: IDBPDatabase<UIStudioDB>) {
    this.tabId = crypto.randomUUID();
    this.channel = new BroadcastChannel('ui-studio-locks');
    this.heldLocks = new Set();
    this.pingInterval = null;
    this.messageHandlers = new Map();
    this.setupListeners();
    this.startPingLoop();
  }

  /**
   * Acquire lock for an instance
   * Returns true if lock acquired, false if already locked by another tab
   */
  async acquireLock(instanceId: string): Promise<boolean> {
    // Check if already locked by another tab
    const existingLock = await this.getLock(instanceId);

    if (existingLock && existingLock.tabId !== this.tabId) {
      // Check if stale (> 5 minutes)
      const age = Date.now() - existingLock.ts;
      if (age < LOCK_TIMEOUT) {
        return false; // Lock is held by another tab
      }
      // Lock is stale, we can acquire it
    }

    // Acquire lock
    const lock: LockRecord = {
      instanceId,
      tabId: this.tabId,
      ts: Date.now(),
    };

    await this.setLock(lock);
    this.heldLocks.add(instanceId);

    // Broadcast lock acquisition
    this.broadcast({
      type: 'lock_acquired',
      instanceId,
      tabId: this.tabId,
    });

    return true;
  }

  /**
   * Release lock for an instance
   */
  async releaseLock(instanceId: string): Promise<void> {
    await this.deleteLock(instanceId);
    this.heldLocks.delete(instanceId);

    // Broadcast lock release
    this.broadcast({
      type: 'lock_released',
      instanceId,
      tabId: this.tabId,
    });
  }

  /**
   * Release all locks held by this tab
   */
  async releaseAllLocks(): Promise<void> {
    const promises = Array.from(this.heldLocks).map((instanceId) =>
      this.releaseLock(instanceId)
    );
    await Promise.all(promises);
  }

  /**
   * Check lock status for an instance
   */
  async getLockStatus(instanceId: string): Promise<LockStatus> {
    const lock = await this.getLock(instanceId);

    if (!lock) {
      return {
        isLocked: false,
        ownedByThisTab: false,
      };
    }

    const age = Date.now() - lock.ts;
    const isStale = age >= LOCK_TIMEOUT;

    if (isStale) {
      return {
        isLocked: false,
        ownedByThisTab: false,
      };
    }

    return {
      isLocked: true,
      ownedByThisTab: lock.tabId === this.tabId,
      lockHolder: lock.tabId,
      lockAge: age,
    };
  }

  /**
   * Register a message handler
   */
  onMessage(handler: (message: LockMessage) => void): () => void {
    const id = crypto.randomUUID();
    this.messageHandlers.set(id, handler);

    // Return unsubscribe function
    return () => {
      this.messageHandlers.delete(id);
    };
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.pingInterval !== null) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    this.channel.close();
    // Note: Don't release locks here - they should persist until page unload
  }

  // Private methods

  private async getLock(instanceId: string): Promise<LockRecord | undefined> {
    return this.db.get('locks', instanceId);
  }

  private async setLock(lock: LockRecord): Promise<void> {
    await this.db.put('locks', lock);
  }

  private async deleteLock(instanceId: string): Promise<void> {
    await this.db.delete('locks', instanceId);
  }

  private broadcast(message: LockMessage): void {
    try {
      this.channel.postMessage(message);
    } catch (error) {
      console.error('Failed to broadcast lock message:', error);
    }
  }

  private setupListeners(): void {
    // Listen for messages from other tabs
    this.channel.onmessage = (event: MessageEvent<LockMessage>) => {
      // Notify all registered handlers
      this.messageHandlers.forEach((handler) => {
        try {
          handler(event.data);
        } catch (error) {
          console.error('Lock message handler error:', error);
        }
      });
    };

    // Release all locks when tab is closing
    window.addEventListener('beforeunload', () => {
      // Use synchronous operations for beforeunload
      this.releaseAllLocks().catch((error) => {
        console.error('Failed to release locks on unload:', error);
      });
    });

    // Handle visibility change (tab becomes hidden)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Update timestamps for all held locks
        this.heldLocks.forEach((instanceId) => {
          this.refreshLock(instanceId).catch((error) => {
            console.error('Failed to refresh lock:', error);
          });
        });
      }
    });
  }

  private startPingLoop(): void {
    // Ping every 30 seconds to keep locks alive
    this.pingInterval = window.setInterval(() => {
      this.heldLocks.forEach((instanceId) => {
        // Update lock timestamp
        this.refreshLock(instanceId).catch((error) => {
          console.error('Failed to refresh lock:', error);
        });

        // Broadcast ping
        this.broadcast({
          type: 'lock_ping',
          instanceId,
          tabId: this.tabId,
        });
      });
    }, PING_INTERVAL);
  }

  private async refreshLock(instanceId: string): Promise<void> {
    const lock = await this.getLock(instanceId);
    if (lock && lock.tabId === this.tabId) {
      lock.ts = Date.now();
      await this.setLock(lock);
    }
  }
}
