/**
 * Integration tests for Milestone 1
 * Tests full instance lifecycle, multi-tab locking, and migrations
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { initDatabase } from '../idb/database';
import { InstanceRepository } from '../idb/instanceRepository';
import { LockManager } from '../locks/lockManager';
import { migrateInstance, CURRENT_SCHEMA_VERSION } from '../migrations/migrator';
import { validateInstance, validateReferences, validatePerformanceLimits } from '../validation/validators';
import type { IDBPDatabase } from 'idb';
import type { UIStudioDB } from '../idb/database';
import type { InstanceJSON } from '../schema/types';

describe('Integration Tests', () => {
  let db: IDBPDatabase<UIStudioDB>;
  let repo: InstanceRepository;

  beforeEach(async () => {
    db = await initDatabase();
    repo = new InstanceRepository(db);
  });

  afterEach(async () => {
    // Clean up
    const allInstances = await repo.getAll();
    for (const instance of allInstances) {
      await repo.delete(instance.id);
    }

    if (db) {
      db.close();
    }
  });

  function createTestInstance(overrides?: Partial<InstanceJSON>): InstanceJSON {
    return {
      id: crypto.randomUUID(),
      schemaVersion: CURRENT_SCHEMA_VERSION,
      name: 'Test App',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      appSpec: {
        name: 'Test App',
        layout: 'single-page',
        testStrategy: 'entry-points-only',
      },
      folders: [],
      components: [],
      services: [],
      contexts: [],
      mocks: {
        components: {},
        services: {},
        contexts: {},
      },
      ...overrides,
    };
  }

  describe('Full instance lifecycle', () => {
    it('should create, read, update, and delete instance', async () => {
      // CREATE
      const instance = createTestInstance({ name: 'My App' });
      await repo.create(instance);

      // READ
      const retrieved = await repo.getById(instance.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('My App');

      // UPDATE
      instance.name = 'My Updated App';
      instance.folders = [{ id: 'folder-1', name: 'auth' }];
      await repo.update(instance);

      const updated = await repo.getById(instance.id);
      expect(updated?.name).toBe('My Updated App');
      expect(updated?.folders).toHaveLength(1);

      // DELETE
      await repo.delete(instance.id);

      const deleted = await repo.getById(instance.id);
      expect(deleted).toBeUndefined();
    });

    it('should maintain data integrity through full lifecycle', async () => {
      const instance = createTestInstance({
        name: 'Complex App',
        folders: [
          { id: 'folder-1', name: 'auth' },
          { id: 'folder-2', name: 'dashboard' },
        ],
        components: [
          {
            id: 'comp-1',
            name: 'LoginForm',
            parentId: 'folder-1',
            props: [
              {
                name: 'onSubmit',
                type: 'function',
                required: true,
              },
            ],
            ui: [],
          },
          {
            id: 'comp-2',
            name: 'Dashboard',
            parentId: 'folder-2',
            props: [],
            ui: [
              {
                type: 'component',
                componentId: 'comp-3',
                props: {},
              },
            ],
          },
          {
            id: 'comp-3',
            name: 'Widget',
            props: [],
            ui: [],
          },
        ],
        contexts: [
          {
            id: 'ctx-1',
            name: 'AuthContext',
            shape: [
              {
                key: 'user',
                type: 'object',
              },
            ],
          },
        ],
      });

      // Create and validate
      await repo.create(instance);

      const retrieved = await repo.getById(instance.id);
      expect(retrieved).toBeDefined();

      // Validate references
      const refErrors = validateReferences(retrieved!);
      expect(refErrors).toHaveLength(0);

      // Update component
      retrieved!.components[0].consumesContexts = ['ctx-1'];
      await repo.update(retrieved!);

      const updated = await repo.getById(instance.id);
      expect(updated?.components[0].consumesContexts).toContain('ctx-1');

      // Validate again
      const refErrors2 = validateReferences(updated!);
      expect(refErrors2).toHaveLength(0);
    });

    it('should validate at every step of lifecycle', async () => {
      const instance = createTestInstance();

      // Create with validation
      await repo.create(instance);
      const created = await repo.getById(instance.id);
      expect(() => validateInstance(created!)).not.toThrow();

      // Update with validation
      instance.name = 'Updated Name';
      await repo.update(instance);
      const updated = await repo.getById(instance.id);
      expect(() => validateInstance(updated!)).not.toThrow();
    });
  });

  describe('Multi-tab locking scenarios', () => {
    it('should prevent concurrent edits from different tabs', async () => {
      const instance = createTestInstance();
      await repo.create(instance);

      const lockManager1 = new LockManager(db);
      const lockManager2 = new LockManager(db);

      // Tab 1 acquires lock
      const acquired1 = await lockManager1.acquireLock(instance.id);
      expect(acquired1).toBe(true);

      // Tab 2 tries to acquire lock
      const acquired2 = await lockManager2.acquireLock(instance.id);
      expect(acquired2).toBe(false);

      // Tab 1 releases lock
      await lockManager1.releaseLock(instance.id);

      // Tab 2 can now acquire lock
      const acquired3 = await lockManager2.acquireLock(instance.id);
      expect(acquired3).toBe(true);

      lockManager1.destroy();
      lockManager2.destroy();
    });

    it('should handle stale locks from closed tabs', async () => {
      const instance = createTestInstance();
      await repo.create(instance);

      // Create a stale lock (older than 5 minutes)
      const staleTimestamp = Date.now() - (6 * 60 * 1000);
      await db.put('locks', {
        instanceId: instance.id,
        tabId: 'stale-tab-id',
        ts: staleTimestamp,
      });

      const lockManager = new LockManager(db);

      // Should be able to acquire stale lock
      const acquired = await lockManager.acquireLock(instance.id);
      expect(acquired).toBe(true);

      lockManager.destroy();
    });

    it('should maintain lock during edit workflow', async () => {
      const instance = createTestInstance();
      await repo.create(instance);

      const lockManager = new LockManager(db);

      // Acquire lock
      const acquired = await lockManager.acquireLock(instance.id);
      expect(acquired).toBe(true);

      // Make edits
      instance.name = 'Edited Name';
      instance.folders = [{ id: 'folder-1', name: 'new-folder' }];
      await repo.update(instance);

      // Verify edits were saved
      const updated = await repo.getById(instance.id);
      expect(updated?.name).toBe('Edited Name');
      expect(updated?.folders).toHaveLength(1);

      // Lock should still be held
      const isLocked = await lockManager.isLocked(instance.id);
      expect(isLocked).toBe(true);

      // Release lock
      await lockManager.releaseLock(instance.id);

      lockManager.destroy();
    });

    it('should broadcast lock events to other tabs', async () => {
      const instance = createTestInstance();
      await repo.create(instance);

      const lockManager1 = new LockManager(db);
      const lockManager2 = new LockManager(db);

      const messages: any[] = [];

      lockManager2['channel'].addEventListener('message', (event) => {
        messages.push(event.data);
      });

      // Tab 1 acquires lock
      await lockManager1.acquireLock(instance.id);

      // Wait for broadcast
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Tab 2 should have received lock_acquired message
      const lockAcquired = messages.find(
        (m) => m.type === 'lock_acquired' && m.instanceId === instance.id
      );
      expect(lockAcquired).toBeDefined();

      // Tab 1 releases lock
      await lockManager1.releaseLock(instance.id);

      // Wait for broadcast
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Tab 2 should have received lock_released message
      const lockReleased = messages.find(
        (m) => m.type === 'lock_released' && m.instanceId === instance.id
      );
      expect(lockReleased).toBeDefined();

      lockManager1.destroy();
      lockManager2.destroy();
    });
  });

  describe('Migration scenarios', () => {
    it('should migrate instance from old schema to current', () => {
      const instance = createTestInstance();

      const migrated = migrateInstance(instance);

      expect(migrated.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
      expect(() => validateInstance(migrated)).not.toThrow();
    });

    it('should preserve data during migration', () => {
      const instance = createTestInstance({
        name: 'My Important App',
        folders: [{ id: 'folder-1', name: 'feature' }],
        components: [
          {
            id: 'comp-1',
            name: 'MyComponent',
            parentId: 'folder-1',
            props: [],
            ui: [],
          },
        ],
      });

      const migrated = migrateInstance(instance);

      expect(migrated.id).toBe(instance.id);
      expect(migrated.name).toBe(instance.name);
      expect(migrated.folders).toEqual(instance.folders);
      expect(migrated.components).toEqual(instance.components);
    });

    it('should validate instance after migration', () => {
      const instance = createTestInstance();

      const migrated = migrateInstance(instance);

      expect(() => validateInstance(migrated)).not.toThrow();
    });
  });

  describe('Search and filter operations', () => {
    it('should search across multiple instances', async () => {
      await repo.create(createTestInstance({ name: 'Shopping Cart App' }));
      await repo.create(createTestInstance({ name: 'Blog Platform' }));
      await repo.create(createTestInstance({ name: 'Shopping List App' }));

      const results = await repo.search('shopping');

      expect(results).toHaveLength(2);
      expect(results.every((r) => r.name.toLowerCase().includes('shopping'))).toBe(true);
    });

    it('should sort instances by last updated', async () => {
      const instance1 = createTestInstance({ name: 'App 1', updatedAt: 1000 });
      const instance2 = createTestInstance({ name: 'App 2', updatedAt: 3000 });
      const instance3 = createTestInstance({ name: 'App 3', updatedAt: 2000 });

      await repo.create(instance1);
      await repo.create(instance2);
      await repo.create(instance3);

      const sorted = await repo.getAllSortedByUpdated();

      expect(sorted[0].name).toBe('App 2');
      expect(sorted[1].name).toBe('App 3');
      expect(sorted[2].name).toBe('App 1');
    });
  });

  describe('Duplication workflow', () => {
    it('should duplicate instance with all data', async () => {
      const original = createTestInstance({
        name: 'Original App',
        folders: [{ id: 'folder-1', name: 'auth' }],
        components: [
          {
            id: 'comp-1',
            name: 'LoginForm',
            parentId: 'folder-1',
            props: [
              {
                name: 'onSubmit',
                type: 'function',
                required: true,
              },
            ],
            ui: [],
          },
        ],
        contexts: [
          {
            id: 'ctx-1',
            name: 'AuthContext',
            shape: [],
          },
        ],
      });

      await repo.create(original);

      const duplicate = await repo.duplicate(original.id, 'Duplicated App');

      expect(duplicate.id).not.toBe(original.id);
      expect(duplicate.name).toBe('Duplicated App');
      expect(duplicate.folders).toEqual(original.folders);
      expect(duplicate.components).toEqual(original.components);
      expect(duplicate.contexts).toEqual(original.contexts);

      // Verify duplicate was saved
      const retrieved = await repo.getById(duplicate.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('Duplicated App');
    });

    it('should validate duplicated instance', async () => {
      const original = createTestInstance();
      await repo.create(original);

      const duplicate = await repo.duplicate(original.id, 'Duplicate');

      expect(() => validateInstance(duplicate)).not.toThrow();

      const refErrors = validateReferences(duplicate);
      expect(refErrors).toHaveLength(0);
    });
  });

  describe('Performance validation', () => {
    it('should validate performance limits on create', async () => {
      const instance = createTestInstance({
        components: Array.from({ length: 501 }, (_, i) => ({
          id: `comp-${i}`,
          name: `Component${i}`,
          props: [],
          ui: [],
        })),
      });

      // Should fail validation due to too many components
      await expect(repo.create(instance)).rejects.toThrow();
    });

    it('should allow instances within performance limits', async () => {
      const instance = createTestInstance({
        components: Array.from({ length: 100 }, (_, i) => ({
          id: `comp-${i}`,
          name: `Component${i}`,
          props: [],
          ui: [],
        })),
        contexts: Array.from({ length: 20 }, (_, i) => ({
          id: `ctx-${i}`,
          name: `Context${i}`,
          shape: [],
        })),
      });

      await expect(repo.create(instance)).resolves.not.toThrow();

      const errors = validatePerformanceLimits(instance);
      expect(errors).toHaveLength(0);
    });
  });

  describe('Concurrent operations', () => {
    it('should handle multiple create operations', async () => {
      const instances = Array.from({ length: 10 }, (_, i) =>
        createTestInstance({ name: `App ${i}` })
      );

      await Promise.all(instances.map((instance) => repo.create(instance)));

      const allInstances = await repo.getAll();
      expect(allInstances).toHaveLength(10);
    });

    it('should handle create and update operations on different instances', async () => {
      const instance1 = createTestInstance({ name: 'App 1' });
      const instance2 = createTestInstance({ name: 'App 2' });

      await repo.create(instance1);
      await repo.create(instance2);

      instance1.name = 'Updated App 1';
      instance2.name = 'Updated App 2';

      await Promise.all([repo.update(instance1), repo.update(instance2)]);

      const updated1 = await repo.getById(instance1.id);
      const updated2 = await repo.getById(instance2.id);

      expect(updated1?.name).toBe('Updated App 1');
      expect(updated2?.name).toBe('Updated App 2');
    });
  });

  describe('Error recovery', () => {
    it('should maintain database consistency after failed create', async () => {
      const validInstance = createTestInstance({ name: 'Valid App' });
      const invalidInstance = {
        id: 'not-a-uuid',
        schemaVersion: CURRENT_SCHEMA_VERSION,
        name: 'Invalid',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        appSpec: {
          name: 'Invalid',
          layout: 'single-page',
          testStrategy: 'entry-points-only',
        },
        folders: [],
        components: [],
        services: [],
        contexts: [],
        mocks: {
          components: {},
          services: {},
          contexts: {},
        },
      };

      await repo.create(validInstance);

      await expect(repo.create(invalidInstance as any)).rejects.toThrow();

      // Valid instance should still exist
      const retrieved = await repo.getById(validInstance.id);
      expect(retrieved).toBeDefined();

      // Only valid instance should exist
      const allInstances = await repo.getAll();
      expect(allInstances).toHaveLength(1);
    });

    it('should maintain database consistency after failed update', async () => {
      const instance = createTestInstance({ name: 'Original Name' });
      await repo.create(instance);

      const originalUpdatedAt = instance.updatedAt;

      // Try invalid update
      instance.name = ''; // Invalid
      await expect(repo.update(instance)).rejects.toThrow();

      // Instance should remain unchanged
      const retrieved = await repo.getById(instance.id);
      expect(retrieved?.name).toBe('Original Name');
      expect(retrieved?.updatedAt).toBe(originalUpdatedAt);
    });
  });
});
