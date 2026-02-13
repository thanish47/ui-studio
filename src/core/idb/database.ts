/**
 * IndexedDB database setup and initialization
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { InstanceJSON } from '../schema';

/**
 * Database schema definition
 */
export interface UIStudioDB extends DBSchema {
  instances: {
    key: string;
    value: InstanceJSON;
    indexes: { 'by-updated': number };
  };
  locks: {
    key: string; // instanceId
    value: LockRecord;
  };
  secrets: {
    key: string;
    value: string;
  };
}

export interface LockRecord {
  instanceId: string;
  tabId: string;
  ts: number;
}

const DB_NAME = 'ui-studio';
const DB_VERSION = 1;

/**
 * Initialize IndexedDB database
 */
export async function initDatabase(): Promise<IDBPDatabase<UIStudioDB>> {
  return openDB<UIStudioDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create instances store
      if (!db.objectStoreNames.contains('instances')) {
        const instanceStore = db.createObjectStore('instances', { keyPath: 'id' });
        instanceStore.createIndex('by-updated', 'updatedAt', { unique: false });
      }

      // Create locks store
      if (!db.objectStoreNames.contains('locks')) {
        db.createObjectStore('locks', { keyPath: 'instanceId' });
      }

      // Create secrets store
      if (!db.objectStoreNames.contains('secrets')) {
        db.createObjectStore('secrets');
      }
    },
    blocked() {
      console.warn('Database upgrade blocked - close other tabs');
    },
    blocking() {
      console.warn('Database blocking upgrade - will close connection');
    },
  });
}

/**
 * Get a singleton database instance
 */
let dbInstance: IDBPDatabase<UIStudioDB> | null = null;

export async function getDatabase(): Promise<IDBPDatabase<UIStudioDB>> {
  if (!dbInstance) {
    dbInstance = await initDatabase();
  }
  return dbInstance;
}

/**
 * Close database connection
 */
export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
