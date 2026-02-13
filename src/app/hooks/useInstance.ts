/**
 * Hook for loading and managing instance
 */

import { useState, useEffect, useCallback } from 'react';
import type { InstanceJSON } from '@/core/schema';
import { initDatabase } from '@/core/idb';
import { InstanceRepository } from '@/core/idb';
import { migrateInstance } from '@/core/migrations';

export function useInstance(instanceId: string) {
  const [instance, setInstance] = useState<InstanceJSON | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [saving, setSaving] = useState(false);

  // Load instance
  useEffect(() => {
    loadInstance();
  }, [instanceId]);

  async function loadInstance() {
    try {
      setLoading(true);
      setError(null);

      const db = await initDatabase();
      const repo = new InstanceRepository(db);
      const loaded = await repo.getById(instanceId);

      if (!loaded) {
        throw new Error(`Instance ${instanceId} not found`);
      }

      // Apply migrations if needed
      const migrated = migrateInstance(loaded);
      setInstance(migrated);
    } catch (err) {
      setError(err as Error);
      setInstance(null);
    } finally {
      setLoading(false);
    }
  }

  // Update instance (in-memory)
  const updateInstance = useCallback((updater: (instance: InstanceJSON) => InstanceJSON) => {
    setInstance((prev) => {
      if (!prev) return null;
      return updater(prev);
    });
  }, []);

  // Save instance to database
  const saveInstance = useCallback(async () => {
    if (!instance) return;

    try {
      setSaving(true);
      setError(null);

      const db = await initDatabase();
      const repo = new InstanceRepository(db);
      await repo.update(instance);
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [instance]);

  // Auto-save with debounce (optional - can be enabled in BuilderPage)
  const autoSave = useCallback(
    async (_debounceMs: number = 2000) => {
      if (!instance) return;

      // Debounce logic would go here
      await saveInstance();
    },
    [instance, saveInstance]
  );

  return {
    instance,
    loading,
    error,
    saving,
    updateInstance,
    saveInstance,
    autoSave,
    reload: loadInstance,
  };
}
