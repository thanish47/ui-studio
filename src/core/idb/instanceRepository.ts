/**
 * Instance CRUD repository
 */

import type { IDBPDatabase } from 'idb';
import type { UIStudioDB } from './database';
import type { InstanceJSON } from '../schema';
import { validateInstance } from '../validation';

export class InstanceRepository {
  constructor(private db: IDBPDatabase<UIStudioDB>) {}

  /**
   * Get all instances
   */
  async getAll(): Promise<InstanceJSON[]> {
    return this.db.getAll('instances');
  }

  /**
   * Get all instances sorted by updated date (newest first)
   */
  async getAllSortedByUpdated(): Promise<InstanceJSON[]> {
    const instances = await this.db.getAllFromIndex('instances', 'by-updated');
    return instances.reverse(); // Newest first
  }

  /**
   * Get instance by ID
   */
  async getById(id: string): Promise<InstanceJSON | undefined> {
    return this.db.get('instances', id);
  }

  /**
   * Create new instance
   */
  async create(instance: InstanceJSON): Promise<void> {
    // Validate before storing
    validateInstance(instance);

    // Ensure timestamps are set
    const now = Date.now();
    instance.createdAt = instance.createdAt || now;
    instance.updatedAt = now;

    await this.db.add('instances', instance);
  }

  /**
   * Update existing instance
   */
  async update(instance: InstanceJSON): Promise<void> {
    // Validate before storing
    validateInstance(instance);

    // Update timestamp
    instance.updatedAt = Date.now();

    await this.db.put('instances', instance);
  }

  /**
   * Delete instance by ID
   */
  async delete(id: string): Promise<void> {
    await this.db.delete('instances', id);
  }

  /**
   * Check if instance exists
   */
  async exists(id: string): Promise<boolean> {
    const instance = await this.getById(id);
    return instance !== undefined;
  }

  /**
   * Count total instances
   */
  async count(): Promise<number> {
    return this.db.count('instances');
  }

  /**
   * Search instances by name
   */
  async searchByName(query: string): Promise<InstanceJSON[]> {
    const all = await this.getAll();
    const lowerQuery = query.toLowerCase();
    return all.filter((instance) =>
      instance.name.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Duplicate an instance with a new ID and name
   */
  async duplicate(id: string, newName: string): Promise<InstanceJSON> {
    const original = await this.getById(id);
    if (!original) {
      throw new Error(`Instance ${id} not found`);
    }

    const duplicate: InstanceJSON = {
      ...JSON.parse(JSON.stringify(original)), // Deep clone
      id: crypto.randomUUID(),
      name: newName,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await this.create(duplicate);
    return duplicate;
  }
}
