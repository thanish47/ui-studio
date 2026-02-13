/**
 * Shared test helpers
 */

import type { InstanceJSON, FolderSpecJSON, ComponentSpecJSON } from '../schema/types';
import { CURRENT_SCHEMA_VERSION } from '../migrations/registry';

export function createTestInstance(overrides?: Partial<InstanceJSON>): InstanceJSON {
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

export function createTestFolder(overrides?: Partial<FolderSpecJSON>): FolderSpecJSON {
  return {
    id: crypto.randomUUID(),
    name: 'test-folder',
    barrelExport: true,
    hasTest: false,
    ...overrides,
  };
}

export function createTestComponent(overrides?: Partial<ComponentSpecJSON>): ComponentSpecJSON {
  return {
    id: crypto.randomUUID(),
    name: 'TestComponent',
    props: [],
    ui: [],
    ...overrides,
  };
}
