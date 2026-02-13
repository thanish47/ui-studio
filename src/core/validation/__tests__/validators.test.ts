/**
 * Validation tests for schema, naming, references, and performance limits
 */

import { describe, it, expect } from 'vitest';
import {
  validateInstance,
  validateNamingConventions,
  validateReferences,
  validatePerformanceLimits,
} from '../validators';
import type { InstanceJSON } from '../../schema/types';
import { CURRENT_SCHEMA_VERSION } from '../../migrations/registry';

describe('validateInstance', () => {
  it('should validate a valid instance', () => {
    const validInstance: InstanceJSON = {
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

    expect(() => validateInstance(validInstance)).not.toThrow();
  });

  it('should reject instance with invalid UUID', () => {
    const invalidInstance = {
      id: 'not-a-uuid',
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

    expect(() => validateInstance(invalidInstance)).toThrow();
  });

  it('should reject instance with negative schema version', () => {
    const invalidInstance = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      schemaVersion: -1,
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

    expect(() => validateInstance(invalidInstance)).toThrow();
  });

  it('should reject instance with empty name', () => {
    const invalidInstance = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      schemaVersion: CURRENT_SCHEMA_VERSION,
      name: '',
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

    expect(() => validateInstance(invalidInstance)).toThrow();
  });

  it('should reject instance with name longer than 100 characters', () => {
    const invalidInstance = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      schemaVersion: CURRENT_SCHEMA_VERSION,
      name: 'a'.repeat(101),
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

    expect(() => validateInstance(invalidInstance)).toThrow();
  });

  it('should reject instance with missing mocks', () => {
    const invalidInstance = {
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
    };

    expect(() => validateInstance(invalidInstance)).toThrow();
  });
});

describe('validateNamingConventions', () => {
  it('should pass for valid PascalCase component names', () => {
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
      components: [
        {
          id: '223e4567-e89b-12d3-a456-426614174000',
          name: 'UserProfile',
          props: [],
          ui: [],
        },
        {
          id: '323e4567-e89b-12d3-a456-426614174000',
          name: 'LoginForm',
          props: [],
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

    const errors = validateNamingConventions(instance);
    expect(errors).toHaveLength(0);
  });

  it('should detect invalid component names (not PascalCase)', () => {
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
      components: [
        {
          id: '223e4567-e89b-12d3-a456-426614174000',
          name: 'userProfile',
          props: [],
          ui: [],
        },
        {
          id: '323e4567-e89b-12d3-a456-426614174000',
          name: 'login-form',
          props: [],
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

    const errors = validateNamingConventions(instance);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].type).toBe('NAMING');
    expect(errors[0].message).toContain('PascalCase');
  });

  it('should pass for valid kebab-case folder names', () => {
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
      folders: [
        {
          id: '223e4567-e89b-12d3-a456-426614174000',
          name: 'user-profile',
        },
        {
          id: '323e4567-e89b-12d3-a456-426614174000',
          name: 'auth',
        },
      ],
      components: [],
      services: [],
      contexts: [],
      mocks: {
        components: {},
        services: {},
        contexts: {},
      },
    };

    const errors = validateNamingConventions(instance);
    expect(errors).toHaveLength(0);
  });

  it('should detect invalid folder names (not kebab-case)', () => {
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
      folders: [
        {
          id: '223e4567-e89b-12d3-a456-426614174000',
          name: 'UserProfile',
        },
        {
          id: '323e4567-e89b-12d3-a456-426614174000',
          name: 'auth_module',
        },
      ],
      components: [],
      services: [],
      contexts: [],
      mocks: {
        components: {},
        services: {},
        contexts: {},
      },
    };

    const errors = validateNamingConventions(instance);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].type).toBe('NAMING');
    expect(errors[0].message).toContain('kebab-case');
  });

  it('should auto-fix component names when fix() is called', () => {
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
      components: [
        {
          id: '223e4567-e89b-12d3-a456-426614174000',
          name: 'user-profile',
          props: [],
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

    const errors = validateNamingConventions(instance);
    expect(errors.length).toBeGreaterThan(0);

    errors.forEach((error) => {
      if (error.fix) error.fix();
    });

    expect(instance.components[0].name).toBe('UserProfile');
  });
});

describe('validateReferences', () => {
  it('should pass when all component parentIds reference valid folders', () => {
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
          props: [],
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

    const errors = validateReferences(instance);
    expect(errors).toHaveLength(0);
  });

  it('should detect invalid component parentId', () => {
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
      components: [
        {
          id: 'comp-1',
          name: 'LoginForm',
          parentId: 'non-existent-folder',
          props: [],
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

    const errors = validateReferences(instance);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].type).toBe('REFERENCE');
    expect(errors[0].message).toContain('parentId');
  });

  it('should pass when all consumesContexts reference valid contexts', () => {
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
      components: [
        {
          id: 'comp-1',
          name: 'UserProfile',
          consumesContexts: ['ctx-1'],
          props: [],
          ui: [],
        },
      ],
      services: [],
      contexts: [
        {
          id: 'ctx-1',
          name: 'AuthContext',
          shape: [],
        },
      ],
      mocks: {
        components: {},
        services: {},
        contexts: {},
      },
    };

    const errors = validateReferences(instance);
    expect(errors).toHaveLength(0);
  });

  it('should detect invalid consumesContexts reference', () => {
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
      components: [
        {
          id: 'comp-1',
          name: 'UserProfile',
          consumesContexts: ['non-existent-context'],
          props: [],
          ui: [],
        },
      ],
      services: [],
      contexts: [],
      mocks: {
        components: {},
        services: {},
        contexts: {},
        contexts: {},
      },
    };

    const errors = validateReferences(instance);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].type).toBe('REFERENCE');
    expect(errors[0].message).toContain('context');
  });

  it('should detect circular component tree references', () => {
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
      components: [
        {
          id: 'comp-1',
          name: 'ComponentA',
          props: [],
          ui: [
            {
              type: 'component',
              componentId: 'comp-2',
              props: {},
            },
          ],
        },
        {
          id: 'comp-2',
          name: 'ComponentB',
          props: [],
          ui: [
            {
              type: 'component',
              componentId: 'comp-1',
              props: {},
            },
          ],
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

    const errors = validateReferences(instance);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.message.includes('circular'))).toBe(true);
  });
});

describe('validatePerformanceLimits', () => {
  it('should pass when component count is under limit', () => {
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
      components: Array.from({ length: 50 }, (_, i) => ({
        id: `comp-${i}`,
        name: `Component${i}`,
        props: [],
        ui: [],
      })),
      services: [],
      contexts: [],
      mocks: {
        components: {},
        services: {},
        contexts: {},
      },
    };

    const errors = validatePerformanceLimits(instance);
    expect(errors).toHaveLength(0);
  });

  it('should detect when component count exceeds 500', () => {
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
      components: Array.from({ length: 501 }, (_, i) => ({
        id: `comp-${i}`,
        name: `Component${i}`,
        props: [],
        ui: [],
      })),
      services: [],
      contexts: [],
      mocks: {
        components: {},
        services: {},
        contexts: {},
      },
    };

    const errors = validatePerformanceLimits(instance);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].type).toBe('PERFORMANCE');
    expect(errors[0].message).toContain('500');
  });

  it('should pass when context count is under limit', () => {
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
      contexts: Array.from({ length: 30 }, (_, i) => ({
        id: `ctx-${i}`,
        name: `Context${i}`,
        shape: [],
      })),
      mocks: {
        components: {},
        services: {},
        contexts: {},
      },
    };

    const errors = validatePerformanceLimits(instance);
    expect(errors).toHaveLength(0);
  });

  it('should detect when context count exceeds 50', () => {
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
      contexts: Array.from({ length: 51 }, (_, i) => ({
        id: `ctx-${i}`,
        name: `Context${i}`,
        shape: [],
      })),
      mocks: {
        components: {},
        services: {},
        contexts: {},
      },
    };

    const errors = validatePerformanceLimits(instance);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].type).toBe('PERFORMANCE');
    expect(errors[0].message).toContain('50');
  });

  it('should pass when component tree depth is under limit', () => {
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
      components: [
        {
          id: 'comp-1',
          name: 'Level1',
          props: [],
          ui: [
            {
              type: 'component',
              componentId: 'comp-2',
              props: {},
            },
          ],
        },
        {
          id: 'comp-2',
          name: 'Level2',
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
          name: 'Level3',
          props: [],
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

    const errors = validatePerformanceLimits(instance);
    expect(errors).toHaveLength(0);
  });

  it('should detect when component tree depth exceeds 10', () => {
    const components = [];
    for (let i = 0; i < 12; i++) {
      components.push({
        id: `comp-${i}`,
        name: `Level${i}`,
        props: [],
        ui:
          i < 11
            ? [
                {
                  type: 'component' as const,
                  componentId: `comp-${i + 1}`,
                  props: {},
                },
              ]
            : [],
      });
    }

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
      components,
      services: [],
      contexts: [],
      mocks: {
        components: {},
        services: {},
        contexts: {},
      },
    };

    const errors = validatePerformanceLimits(instance);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].type).toBe('PERFORMANCE');
    expect(errors[0].message).toContain('10');
  });

  it('should detect when JSON size exceeds 5MB', () => {
    const largeString = 'x'.repeat(6 * 1024 * 1024);

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
      components: [
        {
          id: 'comp-1',
          name: 'LargeComponent',
          props: [
            {
              name: 'largeData',
              type: 'string',
              required: false,
              defaultValue: largeString,
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

    const errors = validatePerformanceLimits(instance);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].type).toBe('PERFORMANCE');
    expect(errors[0].message).toContain('5MB');
  });
});
