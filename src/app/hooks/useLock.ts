/**
 * Hook for managing instance lock (prevent concurrent edits)
 */

import { useState, useEffect } from 'react';
import { initDatabase } from '@/core/idb';
import { LockManager } from '@/core/locks';

export function useLock(instanceId: string) {
  const [hasLock, setHasLock] = useState(false);
  const [lockError, setLockError] = useState<string | null>(null);
  const [lockManager, setLockManager] = useState<LockManager | null>(null);

  useEffect(() => {
    let manager: LockManager | null = null;

    async function initLock() {
      try {
        const db = await initDatabase();
        manager = new LockManager(db);
        setLockManager(manager);

        const acquired = await manager.acquireLock(instanceId);
        if (acquired) {
          setHasLock(true);
          setLockError(null);
        } else {
          setHasLock(false);
          setLockError('This instance is already open in another tab or window');
        }
      } catch (err) {
        setLockError((err as Error).message);
      }
    }

    initLock();

    // Cleanup: release lock when component unmounts
    return () => {
      if (manager) {
        manager.releaseLock(instanceId);
        manager.destroy();
      }
    };
  }, [instanceId]);

  // Force acquire lock (for retry after error)
  const retryAcquireLock = async () => {
    if (!lockManager) return false;

    try {
      const acquired = await lockManager.acquireLock(instanceId);
      if (acquired) {
        setHasLock(true);
        setLockError(null);
        return true;
      } else {
        setLockError('This instance is still locked by another tab');
        return false;
      }
    } catch (err) {
      setLockError((err as Error).message);
      return false;
    }
  };

  return {
    hasLock,
    lockError,
    retryAcquireLock,
  };
}
