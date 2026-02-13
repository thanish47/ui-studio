/**
 * Lock manager tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LockManager } from '../lockManager';
import { initDatabase } from '../../idb/database';
import type { IDBPDatabase } from 'idb';
import type { UIStudioDB } from '../../idb/database';

describe('LockManager', () => {
  let db: IDBPDatabase<UIStudioDB>;
  let lockManager: LockManager;

  beforeEach(async () => {
    db = await initDatabase();
    lockManager = new LockManager(db);
  });

  afterEach(async () => {
    if (lockManager) {
      lockManager.destroy();
    }
    if (db) {
      db.close();
    }
  });

  describe('acquireLock', () => {
    it('should successfully acquire lock for unlocked instance', async () => {
      const instanceId = 'test-instance-1';
      const acquired = await lockManager.acquireLock(instanceId);

      expect(acquired).toBe(true);
    });

    it('should fail to acquire lock held by another tab', async () => {
      const instanceId = 'test-instance-2';

      // First manager acquires lock
      const acquired1 = await lockManager.acquireLock(instanceId);
      expect(acquired1).toBe(true);

      // Second manager tries to acquire same lock
      const lockManager2 = new LockManager(db);
      const acquired2 = await lockManager2.acquireLock(instanceId);
      expect(acquired2).toBe(false);

      lockManager2.destroy();
    });

    it('should acquire multiple locks for different instances', async () => {
      const instance1 = 'test-instance-3';
      const instance2 = 'test-instance-4';

      const acquired1 = await lockManager.acquireLock(instance1);
      const acquired2 = await lockManager.acquireLock(instance2);

      expect(acquired1).toBe(true);
      expect(acquired2).toBe(true);
    });

    it('should re-acquire lock on same instance by same tab', async () => {
      const instanceId = 'test-instance-5';

      const acquired1 = await lockManager.acquireLock(instanceId);
      expect(acquired1).toBe(true);

      // Same manager should be able to "re-acquire" (refresh) its own lock
      const acquired2 = await lockManager.acquireLock(instanceId);
      expect(acquired2).toBe(true);
    });
  });

  describe('releaseLock', () => {
    it('should release held lock', async () => {
      const instanceId = 'test-instance-6';

      await lockManager.acquireLock(instanceId);
      await lockManager.releaseLock(instanceId);

      // Another manager should be able to acquire now
      const lockManager2 = new LockManager(db);
      const acquired = await lockManager2.acquireLock(instanceId);
      expect(acquired).toBe(true);

      lockManager2.destroy();
    });

    it('should not fail when releasing non-existent lock', async () => {
      const instanceId = 'non-existent-lock';

      // Should not throw
      await expect(lockManager.releaseLock(instanceId)).resolves.not.toThrow();
    });

    it('should not affect other held locks', async () => {
      const instance1 = 'test-instance-7';
      const instance2 = 'test-instance-8';

      await lockManager.acquireLock(instance1);
      await lockManager.acquireLock(instance2);

      await lockManager.releaseLock(instance1);

      // instance2 should still be locked
      const lockManager2 = new LockManager(db);
      const acquired = await lockManager2.acquireLock(instance2);
      expect(acquired).toBe(false);

      lockManager2.destroy();
    });
  });

  describe('releaseAllLocks', () => {
    it('should release all locks held by tab', async () => {
      const instance1 = 'test-instance-9';
      const instance2 = 'test-instance-10';

      await lockManager.acquireLock(instance1);
      await lockManager.acquireLock(instance2);

      await lockManager.releaseAllLocks();

      // Both should be available to another manager
      const lockManager2 = new LockManager(db);
      const acquired1 = await lockManager2.acquireLock(instance1);
      const acquired2 = await lockManager2.acquireLock(instance2);

      expect(acquired1).toBe(true);
      expect(acquired2).toBe(true);

      lockManager2.destroy();
    });

    it('should work when no locks are held', async () => {
      await expect(lockManager.releaseAllLocks()).resolves.not.toThrow();
    });
  });

  describe('isLocked', () => {
    it('should return false for unlocked instance', async () => {
      const instanceId = 'test-instance-11';
      const locked = await lockManager.isLocked(instanceId);

      expect(locked).toBe(false);
    });

    it('should return true for locked instance', async () => {
      const instanceId = 'test-instance-12';

      await lockManager.acquireLock(instanceId);
      const locked = await lockManager.isLocked(instanceId);

      expect(locked).toBe(true);
    });

    it('should return false after lock is released', async () => {
      const instanceId = 'test-instance-13';

      await lockManager.acquireLock(instanceId);
      await lockManager.releaseLock(instanceId);

      const locked = await lockManager.isLocked(instanceId);
      expect(locked).toBe(false);
    });
  });

  describe('stale lock detection', () => {
    it('should acquire stale lock after timeout', async () => {
      const instanceId = 'test-instance-14';

      // Manually create a stale lock (older than 5 minutes)
      const staleTimestamp = Date.now() - (6 * 60 * 1000); // 6 minutes ago
      await db.put('locks', {
        instanceId,
        tabId: 'old-tab-id',
        ts: staleTimestamp,
      });

      // Should be able to acquire the stale lock
      const acquired = await lockManager.acquireLock(instanceId);
      expect(acquired).toBe(true);
    });

    it('should not acquire recent lock from another tab', async () => {
      const instanceId = 'test-instance-15';

      // Create a recent lock from another tab
      const recentTimestamp = Date.now() - (1 * 60 * 1000); // 1 minute ago
      await db.put('locks', {
        instanceId,
        tabId: 'another-tab-id',
        ts: recentTimestamp,
      });

      // Should NOT be able to acquire
      const acquired = await lockManager.acquireLock(instanceId);
      expect(acquired).toBe(false);
    });
  });

  describe('ping mechanism', () => {
    it('should refresh lock timestamp via ping', async () => {
      const instanceId = 'test-instance-16';

      await lockManager.acquireLock(instanceId);

      const lock1 = await db.get('locks', instanceId);
      expect(lock1).toBeDefined();
      const timestamp1 = lock1!.ts;

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Manually trigger a ping
      await lockManager.refreshLock(instanceId);

      const lock2 = await db.get('locks', instanceId);
      expect(lock2).toBeDefined();
      expect(lock2!.ts).toBeGreaterThan(timestamp1);
    });
  });

  describe('getLockOwner', () => {
    it('should return null for unlocked instance', async () => {
      const instanceId = 'test-instance-17';
      const owner = await lockManager.getLockOwner(instanceId);

      expect(owner).toBeNull();
    });

    it('should return tabId for locked instance', async () => {
      const instanceId = 'test-instance-18';

      await lockManager.acquireLock(instanceId);
      const owner = await lockManager.getLockOwner(instanceId);

      expect(owner).toBeDefined();
      expect(typeof owner).toBe('string');
    });

    it('should return null for stale lock', async () => {
      const instanceId = 'test-instance-19';

      // Create a stale lock
      const staleTimestamp = Date.now() - (6 * 60 * 1000);
      await db.put('locks', {
        instanceId,
        tabId: 'stale-tab-id',
        ts: staleTimestamp,
      });

      const owner = await lockManager.getLockOwner(instanceId);
      expect(owner).toBeNull();
    });
  });

  describe('destroy', () => {
    it('should release all locks on destroy', async () => {
      const instance1 = 'test-instance-20';
      const instance2 = 'test-instance-21';

      await lockManager.acquireLock(instance1);
      await lockManager.acquireLock(instance2);

      lockManager.destroy();

      // Locks should be released
      const lockManager2 = new LockManager(db);
      const acquired1 = await lockManager2.acquireLock(instance1);
      const acquired2 = await lockManager2.acquireLock(instance2);

      expect(acquired1).toBe(true);
      expect(acquired2).toBe(true);

      lockManager2.destroy();
    });

    it('should close BroadcastChannel on destroy', () => {
      // Create a spy to check if channel.close() is called
      const closeSpy = vi.spyOn(lockManager['channel'], 'close');

      lockManager.destroy();

      expect(closeSpy).toHaveBeenCalled();
    });

    it('should clear ping interval on destroy', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

      lockManager.destroy();

      expect(clearIntervalSpy).toHaveBeenCalled();
    });
  });

  describe('cross-tab coordination', () => {
    it('should broadcast lock acquisition', async () => {
      const instanceId = 'test-instance-22';

      // Create another manager to listen
      const lockManager2 = new LockManager(db);
      const messages: any[] = [];

      lockManager2['channel'].addEventListener('message', (event) => {
        messages.push(event.data);
      });

      await lockManager.acquireLock(instanceId);

      // Wait for broadcast
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Should have received lock_acquired message
      const lockAcquired = messages.find((m) => m.type === 'lock_acquired');
      expect(lockAcquired).toBeDefined();
      expect(lockAcquired?.instanceId).toBe(instanceId);

      lockManager2.destroy();
    });

    it('should broadcast lock release', async () => {
      const instanceId = 'test-instance-23';

      const lockManager2 = new LockManager(db);
      const messages: any[] = [];

      lockManager2['channel'].addEventListener('message', (event) => {
        messages.push(event.data);
      });

      await lockManager.acquireLock(instanceId);
      await lockManager.releaseLock(instanceId);

      // Wait for broadcast
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Should have received lock_released message
      const lockReleased = messages.find((m) => m.type === 'lock_released');
      expect(lockReleased).toBeDefined();
      expect(lockReleased?.instanceId).toBe(instanceId);

      lockManager2.destroy();
    });
  });
});
