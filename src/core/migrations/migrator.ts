/**
 * Migration executor
 * Applies sequential migrations to bring instances up to current schema version
 */

import { migrations } from './registry';
import { CURRENT_SCHEMA_VERSION } from './types';
import { validateInstance } from '../validation';
import type { InstanceJSON } from '../schema';

/**
 * Migrate instance from any version to current version
 */
export function migrateInstance(instance: any): InstanceJSON {
  if (!instance.schemaVersion) {
    throw new Error('Instance missing schemaVersion field');
  }

  if (instance.schemaVersion > CURRENT_SCHEMA_VERSION) {
    throw new Error(
      `Instance schema version ${instance.schemaVersion} is newer than supported version ${CURRENT_SCHEMA_VERSION}. ` +
        'Please update UI Studio to the latest version.'
    );
  }

  if (instance.schemaVersion === CURRENT_SCHEMA_VERSION) {
    // Already at current version, just validate
    return validateInstance(instance);
  }

  // Apply migrations sequentially
  let current = instance;
  const targetVersion = CURRENT_SCHEMA_VERSION;

  for (let v = instance.schemaVersion + 1; v <= targetVersion; v++) {
    if (migrations[v]) {
      console.log(`Migrating instance ${instance.id} from v${v - 1} to v${v}`);
      current = migrations[v](current);
      current.schemaVersion = v;
    } else {
      throw new Error(`No migration defined for version ${v}`);
    }
  }

  // Validate migrated instance
  return validateInstance(current);
}

/**
 * Check if instance needs migration
 */
export function needsMigration(instance: any): boolean {
  if (!instance.schemaVersion) {
    return false; // Invalid instance
  }
  return instance.schemaVersion < CURRENT_SCHEMA_VERSION;
}

/**
 * Get migration path (list of versions to migrate through)
 */
export function getMigrationPath(fromVersion: number): number[] {
  const path: number[] = [];
  for (let v = fromVersion + 1; v <= CURRENT_SCHEMA_VERSION; v++) {
    if (migrations[v]) {
      path.push(v);
    }
  }
  return path;
}
