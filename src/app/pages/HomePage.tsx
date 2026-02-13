/**
 * Home page - List all instances
 */

import { useState, useEffect } from 'react';
import { getDatabase } from '../../core/idb';
import { InstanceRepository } from '../../core/idb';
import { CURRENT_SCHEMA_VERSION } from '../../core/migrations';
import type { InstanceJSON } from '../../core/schema';
import { InstanceList } from '../components/InstanceList';
import { CreateInstanceDialog } from '../components/CreateInstanceDialog';
import './HomePage.css';

export function HomePage() {
  const [instances, setInstances] = useState<InstanceJSON[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInstances();
  }, []);

  async function loadInstances() {
    try {
      setLoading(true);
      setError(null);
      const db = await getDatabase();
      const repo = new InstanceRepository(db);
      const allInstances = await repo.getAllSortedByUpdated();
      setInstances(allInstances);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load instances');
      console.error('Failed to load instances:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateInstance(name: string) {
    try {
      const newInstance: InstanceJSON = {
        id: crypto.randomUUID(),
        schemaVersion: CURRENT_SCHEMA_VERSION,
        name,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        appSpec: {
          name,
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

      const db = await getDatabase();
      const repo = new InstanceRepository(db);
      await repo.create(newInstance);

      // Reload instances
      await loadInstances();
      setShowCreateDialog(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create instance');
      console.error('Failed to create instance:', err);
    }
  }

  async function handleDeleteInstance(id: string) {
    if (!confirm('Are you sure you want to delete this project? This cannot be undone.')) {
      return;
    }

    try {
      const db = await getDatabase();
      const repo = new InstanceRepository(db);
      await repo.delete(id);
      await loadInstances();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete instance');
      console.error('Failed to delete instance:', err);
    }
  }

  async function handleDuplicateInstance(id: string) {
    const instance = instances.find((i) => i.id === id);
    if (!instance) return;

    const newName = prompt('Enter name for duplicate:', `${instance.name} (Copy)`);
    if (!newName) return;

    try {
      const db = await getDatabase();
      const repo = new InstanceRepository(db);
      await repo.duplicate(id, newName);
      await loadInstances();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate instance');
      console.error('Failed to duplicate instance:', err);
    }
  }

  return (
    <div className="home-page">
      <header className="home-header">
        <h1>UI Studio</h1>
        <p className="subtitle">Build React apps visually</p>
      </header>

      <div className="home-content">
        {error && (
          <div className="error-banner">
            <strong>Error:</strong> {error}
            <button onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}

        <div className="actions-bar">
          <button className="btn-primary" onClick={() => setShowCreateDialog(true)}>
            + Create New Project
          </button>
          <button className="btn-secondary" onClick={loadInstances}>
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="loading">Loading projects...</div>
        ) : instances.length === 0 ? (
          <div className="empty-state">
            <h2>No projects yet</h2>
            <p>Create your first project to get started</p>
            <button className="btn-primary" onClick={() => setShowCreateDialog(true)}>
              Create Project
            </button>
          </div>
        ) : (
          <InstanceList
            instances={instances}
            onDelete={handleDeleteInstance}
            onDuplicate={handleDuplicateInstance}
          />
        )}
      </div>

      {showCreateDialog && (
        <CreateInstanceDialog
          onConfirm={handleCreateInstance}
          onCancel={() => setShowCreateDialog(false)}
        />
      )}
    </div>
  );
}
