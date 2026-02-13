/**
 * Migration registry
 * Add new migrations here as the schema evolves
 */

import type { MigrationFn } from './types';

/**
 * Migration registry
 * Key = target version number
 * Value = migration function from previous version
 */
export const migrations: Record<number, MigrationFn> = {
  // Example migration for version 2 (when needed):
  // 2: (instance: any) => ({
  //   ...instance,
  //   schemaVersion: 2,
  //   appSpec: {
  //     ...instance.appSpec,
  //     newField: 'defaultValue',
  //   },
  // }),
};
