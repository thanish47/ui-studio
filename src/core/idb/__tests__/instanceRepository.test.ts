/**
 * Instance repository CRUD tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { InstanceRepository } from '../instanceRepository';
import { initDatabase } from '../database';
import type { IDBPDatabase } from 'idb';
import type { UIStudioDB } from '../database';
import type { InstanceJSON } from '../../schema/types';
import { CURRENT_SCHEMA_VERSION } from '../../migrations/registry';

describe('InstanceRepository', () => {
  let db: IDBPDatabase<UIStudioDB>;
  let repo: InstanceRepository;

  beforeEach(async () => {
    db = await initDatabase();
    repo = new InstanceRepository(db);
  });

  afterEach(async () => {
    // Clean up all instances
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

  describe('create', () => {
    it('should create a new instance', async () => {
      const instance = createTestInstance();

      await repo.create(instance);

      const retrieved = await repo.getById(instance.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(instance.id);
      expect(retrieved?.name).toBe(instance.name);
    });

    it('should set createdAt timestamp if not provided', async () => {
      const instance = createTestInstance();
      delete (instance as any).createdAt;

      const beforeCreate = Date.now();
      await repo.create(instance);
      const afterCreate = Date.now();

      const retrieved = await repo.getById(instance.id);
      expect(retrieved?.createdAt).toBeGreaterThanOrEqual(beforeCreate);
      expect(retrieved?.createdAt).toBeLessThanOrEqual(afterCreate);
    });

    it('should set updatedAt timestamp', async () => {
      const instance = createTestInstance();

      const beforeCreate = Date.now();
      await repo.create(instance);
      const afterCreate = Date.now();

      const retrieved = await repo.getById(instance.id);
      expect(retrieved?.updatedAt).toBeGreaterThanOrEqual(beforeCreate);
      expect(retrieved?.updatedAt).toBeLessThanOrEqual(afterCreate);
    });

    it('should validate instance before creating', async () => {
      const invalidInstance = {
        id: 'not-a-uuid',
        schemaVersion: CURRENT_SCHEMA_VERSION,
        name: 'Test',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        appSpec: {
          name: 'Test',
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

      await expect(repo.create(invalidInstance as any)).rejects.toThrow();
    });

    it('should reject duplicate instance IDs', async () => {
      const instance = createTestInstance();

      await repo.create(instance);

      // Try to create another instance with same ID
      await expect(repo.create(instance)).rejects.toThrow();
    });
  });

  describe('getById', () => {
    it('should retrieve instance by ID', async () => {
      const instance = createTestInstance();
      await repo.create(instance);

      const retrieved = await repo.getById(instance.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(instance.id);
      expect(retrieved?.name).toBe(instance.name);
    });

    it('should return undefined for non-existent ID', async () => {
      const retrieved = await repo.getById('non-existent-id');

      expect(retrieved).toBeUndefined();
    });

    it('should retrieve complete instance data', async () => {
      const instance = createTestInstance({
        folders: [
          {
            id: 'folder-1',
            name: 'auth',
          },
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
        ],
      });

      await repo.create(instance);
      const retrieved = await repo.getById(instance.id);

      expect(retrieved?.folders).toHaveLength(1);
      expect(retrieved?.components).toHaveLength(1);
      expect(retrieved?.components[0].name).toBe('LoginForm');
    });
  });

  describe('getAll', () => {
    it('should return empty array when no instances exist', async () => {
      const instances = await repo.getAll();

      expect(instances).toEqual([]);
    });

    it('should return all instances', async () => {
      const instance1 = createTestInstance({ name: 'App 1' });
      const instance2 = createTestInstance({ name: 'App 2' });
      const instance3 = createTestInstance({ name: 'App 3' });

      await repo.create(instance1);
      await repo.create(instance2);
      await repo.create(instance3);

      const instances = await repo.getAll();

      expect(instances).toHaveLength(3);
      expect(instances.map((i) => i.name)).toContain('App 1');
      expect(instances.map((i) => i.name)).toContain('App 2');
      expect(instances.map((i) => i.name)).toContain('App 3');
    });
  });

  describe('getAllSortedByUpdated', () => {
    it('should return instances sorted by updatedAt (newest first)', async () => {
      const instance1 = createTestInstance({ name: 'App 1', updatedAt: 1000 });
      const instance2 = createTestInstance({ name: 'App 2', updatedAt: 3000 });
      const instance3 = createTestInstance({ name: 'App 3', updatedAt: 2000 });

      await repo.create(instance1);
      await repo.create(instance2);
      await repo.create(instance3);

      const instances = await repo.getAllSortedByUpdated();

      expect(instances).toHaveLength(3);
      expect(instances[0].name).toBe('App 2'); // updatedAt: 3000
      expect(instances[1].name).toBe('App 3'); // updatedAt: 2000
      expect(instances[2].name).toBe('App 1'); // updatedAt: 1000
    });

    it('should return empty array when no instances exist', async () => {
      const instances = await repo.getAllSortedByUpdated();

      expect(instances).toEqual([]);
    });
  });

  describe('update', () => {
    it('should update existing instance', async () => {
      const instance = createTestInstance({ name: 'Original Name' });
      await repo.create(instance);

      instance.name = 'Updated Name';
      await repo.update(instance);

      const retrieved = await repo.getById(instance.id);
      expect(retrieved?.name).toBe('Updated Name');
    });

    it('should update updatedAt timestamp', async () => {
      const instance = createTestInstance();
      await repo.create(instance);

      const originalUpdatedAt = instance.updatedAt;

      // Wait a bit to ensure timestamp changes
      await new Promise((resolve) => setTimeout(resolve, 10));

      instance.name = 'Updated Name';
      await repo.update(instance);

      const retrieved = await repo.getById(instance.id);
      expect(retrieved?.updatedAt).toBeGreaterThan(originalUpdatedAt);
    });

    it('should preserve createdAt timestamp', async () => {
      const instance = createTestInstance();
      await repo.create(instance);

      const originalCreatedAt = instance.createdAt;

      instance.name = 'Updated Name';
      await repo.update(instance);

      const retrieved = await repo.getById(instance.id);
      expect(retrieved?.createdAt).toBe(originalCreatedAt);
    });

    it('should validate instance before updating', async () => {
      const instance = createTestInstance();
      await repo.create(instance);

      instance.name = ''; // Invalid: empty name

      await expect(repo.update(instance)).rejects.toThrow();
    });

    it('should update all instance fields', async () => {
      const instance = createTestInstance();
      await repo.create(instance);

      instance.folders = [{ id: 'folder-1', name: 'auth' }];
      instance.components = [
        {
          id: 'comp-1',
          name: 'LoginForm',
          props: [],
          ui: [],
        },
      ];

      await repo.update(instance);

      const retrieved = await repo.getById(instance.id);
      expect(retrieved?.folders).toHaveLength(1);
      expect(retrieved?.components).toHaveLength(1);
    });
  });

  describe('delete', () => {
    it('should delete instance by ID', async () => {
      const instance = createTestInstance();
      await repo.create(instance);

      await repo.delete(instance.id);

      const retrieved = await repo.getById(instance.id);
      expect(retrieved).toBeUndefined();
    });

    it('should not fail when deleting non-existent instance', async () => {
      await expect(repo.delete('non-existent-id')).resolves.not.toThrow();
    });

    it('should only delete specified instance', async () => {
      const instance1 = createTestInstance({ name: 'App 1' });
      const instance2 = createTestInstance({ name: 'App 2' });

      await repo.create(instance1);
      await repo.create(instance2);

      await repo.delete(instance1.id);

      const retrieved1 = await repo.getById(instance1.id);
      const retrieved2 = await repo.getById(instance2.id);

      expect(retrieved1).toBeUndefined();
      expect(retrieved2).toBeDefined();
    });
  });

  describe('search', () => {
    it('should find instances by name substring (case-insensitive)', async () => {
      const instance1 = createTestInstance({ name: 'My Shopping App' });
      const instance2 = createTestInstance({ name: 'My Blog App' });
      const instance3 = createTestInstance({ name: 'Dashboard' });

      await repo.create(instance1);
      await repo.create(instance2);
      await repo.create(instance3);

      const results = await repo.search('shopping');

      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('My Shopping App');
    });

    it('should return empty array when no matches', async () => {
      const instance = createTestInstance({ name: 'My App' });
      await repo.create(instance);

      const results = await repo.search('nonexistent');

      expect(results).toEqual([]);
    });

    it('should be case-insensitive', async () => {
      const instance = createTestInstance({ name: 'My Shopping App' });
      await repo.create(instance);

      const results1 = await repo.search('SHOPPING');
      const results2 = await repo.search('shopping');
      const results3 = await repo.search('ShOpPiNg');

      expect(results1).toHaveLength(1);
      expect(results2).toHaveLength(1);
      expect(results3).toHaveLength(1);
    });

    it('should match partial strings', async () => {
      const instance = createTestInstance({ name: 'E-commerce Platform' });
      await repo.create(instance);

      const results = await repo.search('commerce');

      expect(results).toHaveLength(1);
    });
  });

  describe('duplicate', () => {
    it('should create duplicate instance with new ID', async () => {
      const original = createTestInstance({ name: 'Original App' });
      await repo.create(original);

      const duplicate = await repo.duplicate(original.id, 'Duplicated App');

      expect(duplicate.id).not.toBe(original.id);
      expect(duplicate.name).toBe('Duplicated App');
    });

    it('should preserve all data except ID, name, and timestamps', async () => {
      const original = createTestInstance({
        name: 'Original App',
        folders: [{ id: 'folder-1', name: 'auth' }],
        components: [
          {
            id: 'comp-1',
            name: 'LoginForm',
            props: [],
            ui: [],
          },
        ],
      });

      await repo.create(original);

      const duplicate = await repo.duplicate(original.id, 'Duplicated App');

      expect(duplicate.folders).toEqual(original.folders);
      expect(duplicate.components).toEqual(original.components);
      expect(duplicate.appSpec).toEqual(original.appSpec);
    });

    it('should set new createdAt and updatedAt timestamps', async () => {
      const original = createTestInstance({
        createdAt: 1000,
        updatedAt: 2000,
      });

      await repo.create(original);

      const beforeDuplicate = Date.now();
      const duplicate = await repo.duplicate(original.id, 'Duplicated App');
      const afterDuplicate = Date.now();

      expect(duplicate.createdAt).toBeGreaterThanOrEqual(beforeDuplicate);
      expect(duplicate.createdAt).toBeLessThanOrEqual(afterDuplicate);
      expect(duplicate.updatedAt).toBeGreaterThanOrEqual(beforeDuplicate);
      expect(duplicate.updatedAt).toBeLessThanOrEqual(afterDuplicate);
    });

    it('should save duplicate to database', async () => {
      const original = createTestInstance({ name: 'Original App' });
      await repo.create(original);

      const duplicate = await repo.duplicate(original.id, 'Duplicated App');

      const retrieved = await repo.getById(duplicate.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('Duplicated App');
    });

    it('should throw error when duplicating non-existent instance', async () => {
      await expect(
        repo.duplicate('non-existent-id', 'Duplicate')
      ).rejects.toThrow('not found');
    });
  });

  describe('data integrity', () => {
    it('should maintain referential integrity after update', async () => {
      const instance = createTestInstance({
        folders: [{ id: 'folder-1', name: 'auth' }],
        components: [
          {
            id: 'comp-1',
            name: 'LoginForm',
            parentId: 'folder-1',
            props: [],
            ui: [],
          },
        ],
      });

      await repo.create(instance);

      // Update component
      instance.components[0].name = 'UpdatedLoginForm';
      await repo.update(instance);

      const retrieved = await repo.getById(instance.id);
      expect(retrieved?.components[0].name).toBe('UpdatedLoginForm');
      expect(retrieved?.components[0].parentId).toBe('folder-1');
    });

    it('should handle complex nested data structures', async () => {
      const instance = createTestInstance({
        components: [
          {
            id: 'comp-1',
            name: 'ComplexComponent',
            props: [
              {
                name: 'config',
                type: 'object',
                required: true,
                defaultValue: {
                  nested: {
                    deeply: {
                      value: 'test',
                    },
                  },
                },
              },
            ],
            ui: [
              {
                type: 'container',
                children: [
                  {
                    type: 'text',
                    content: 'Hello',
                  },
                  {
                    type: 'component',
                    componentId: 'comp-2',
                    props: {},
                  },
                ],
              },
            ],
          },
        ],
      });

      await repo.create(instance);

      const retrieved = await repo.getById(instance.id);
      expect(retrieved?.components[0].props[0].defaultValue).toEqual({
        nested: {
          deeply: {
            value: 'test',
          },
        },
      });
    });
  });
});
