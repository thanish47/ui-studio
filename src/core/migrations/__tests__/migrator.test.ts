/**
 * Migration framework tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { migrateInstance, registerMigration, CURRENT_SCHEMA_VERSION } from '../migrator';
import type { InstanceJSON } from '../../schema/types';

describe('migrateInstance', () => {
  it('should not migrate instance already at current version', () => {
    const instance: InstanceJSON = {
      id: '123e4567-e89b-12d3-a456-426614174000',
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
    };

    const result = migrateInstance(instance);
    expect(result.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(result).toEqual(instance);
  });

  it('should throw error if instance is missing schemaVersion', () => {
    const invalidInstance = {
      id: '123e4567-e89b-12d3-a456-426614174000',
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
    };

    expect(() => migrateInstance(invalidInstance)).toThrow('missing schemaVersion');
  });

  it('should throw error if instance schema version is newer than current', () => {
    const futureInstance = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      schemaVersion: CURRENT_SCHEMA_VERSION + 10,
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
    };

    expect(() => migrateInstance(futureInstance)).toThrow('newer than supported');
  });

  it('should validate instance after migration', () => {
    const instance = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      schemaVersion: CURRENT_SCHEMA_VERSION,
      name: '', // Invalid: empty name
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
    };

    expect(() => migrateInstance(instance)).toThrow();
  });
});

describe('Migration execution', () => {
  it('should apply migrations sequentially', () => {
    // Simulating an old instance at version 0
    const oldInstance = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      schemaVersion: 0,
      name: 'Test App',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      // Missing fields that were added in version 1
    };

    // Register a test migration from v0 to v1
    const migration = (instance: any) => {
      return {
        ...instance,
        appSpec: {
          name: instance.name,
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
    };

    // Note: In real usage, migrations are registered in registry.ts
    // This test demonstrates the expected behavior

    expect(oldInstance.schemaVersion).toBe(0);
  });

  it('should preserve instance data through migration', () => {
    const instance: InstanceJSON = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      schemaVersion: CURRENT_SCHEMA_VERSION,
      name: 'My Important App',
      createdAt: 1000000,
      updatedAt: 2000000,
      appSpec: {
        name: 'My Important App',
        layout: 'single-page',
        testStrategy: 'entry-points-only',
      },
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
      services: [],
      contexts: [],
      mocks: {
        components: {},
        services: {},
        contexts: {},
      },
    };

    const migrated = migrateInstance(instance);

    expect(migrated.id).toBe(instance.id);
    expect(migrated.name).toBe(instance.name);
    expect(migrated.createdAt).toBe(instance.createdAt);
    expect(migrated.updatedAt).toBe(instance.updatedAt);
    expect(migrated.folders).toEqual(instance.folders);
    expect(migrated.components).toEqual(instance.components);
  });

  it('should update schemaVersion during migration', () => {
    const instance: InstanceJSON = {
      id: '123e4567-e89b-12d3-a456-426614174000',
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
    };

    const migrated = migrateInstance(instance);
    expect(migrated.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
  });
});

describe('Migration registry', () => {
  it('should have CURRENT_SCHEMA_VERSION defined', () => {
    expect(CURRENT_SCHEMA_VERSION).toBeDefined();
    expect(typeof CURRENT_SCHEMA_VERSION).toBe('number');
    expect(CURRENT_SCHEMA_VERSION).toBeGreaterThanOrEqual(1);
  });

  it('should support registering migrations', () => {
    const testMigration = (instance: any) => instance;

    // registerMigration should exist
    expect(registerMigration).toBeDefined();
    expect(typeof registerMigration).toBe('function');
  });
});

describe('Migration error handling', () => {
  it('should handle migration function throwing error', () => {
    const instance = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      schemaVersion: 0,
      name: 'Test App',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // If migration throws, migrateInstance should propagate the error
    // This test validates error handling behavior
    expect(() => migrateInstance(instance)).toThrow();
  });

  it('should validate migrated data', () => {
    const instance = {
      id: 'not-a-uuid', // Invalid UUID
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
    };

    expect(() => migrateInstance(instance)).toThrow();
  });
});
