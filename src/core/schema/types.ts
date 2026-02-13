/**
 * Core type definitions for UI Studio
 * Based on milestone-1-core-persistence.md
 */

import type { AppSpecJSON } from './appSpec';
import type { FolderSpecJSON } from './folderSpec';
import type { ComponentSpecJSON } from './componentSpec';
import type { ServiceSpecJSON } from './serviceSpec';
import type { ContextSpec } from './contextSpec';

/**
 * Root instance JSON structure
 * Represents a complete UI Studio project
 */
export interface InstanceJSON {
  id: string;
  schemaVersion: number;
  name: string;
  createdAt: number;
  updatedAt: number;
  appSpec: AppSpecJSON;
  folders: FolderSpecJSON[];
  components: ComponentSpecJSON[];
  services: ServiceSpecJSON[];
  contexts: ContextSpec[];
  mocks: MockData;
}

/**
 * Mock data structure for preview
 */
export interface MockData {
  components: Record<string, ComponentMockData>;
  services: Record<string, ServiceMockData>;
  contexts: Record<string, any>;
}

export interface ComponentMockData {
  props?: Record<string, any>;
  state?: Record<string, any>;
}

export interface ServiceMockData {
  [methodName: string]: any;
}
