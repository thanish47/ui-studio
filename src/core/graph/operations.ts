/**
 * Tree manipulation operations
 */

import type { InstanceJSON, ComponentSpecJSON, FolderSpecJSON } from '../schema/types';
import type { NodeSpec } from './tree';
import { Tree } from './tree';

/**
 * Add a new node to the instance
 */
export function addNode(
  instance: InstanceJSON,
  parentId: string | null,
  nodeType: 'folder' | 'component' | 'service' | 'context',
  spec: NodeSpec
): InstanceJSON {
  const updated = { ...instance };

  switch (nodeType) {
    case 'folder':
      updated.folders = [...updated.folders, spec as FolderSpecJSON];
      break;
    case 'component':
      const componentSpec = spec as ComponentSpecJSON;
      if (parentId) {
        componentSpec.parentId = parentId;
      }
      updated.components = [...updated.components, componentSpec];
      break;
    case 'service':
      updated.services = [...updated.services, spec as any];
      break;
    case 'context':
      updated.contexts = [...updated.contexts, spec as any];
      break;
  }

  updated.updatedAt = Date.now();
  return updated;
}

/**
 * Remove a node and all its descendants
 */
export function removeNode(instance: InstanceJSON, id: string): InstanceJSON {
  const tree = new Tree(instance);
  const node = tree.getNode(id);

  if (!node) {
    return instance;
  }

  // Get all descendants to remove
  const descendants = tree.getDescendants(id);
  const idsToRemove = new Set([id, ...descendants.map((n) => n.id)]);

  const updated = { ...instance };

  // Remove from appropriate arrays
  updated.folders = updated.folders.filter((f) => !idsToRemove.has(f.id));
  updated.components = updated.components.filter((c) => !idsToRemove.has(c.id));
  updated.services = updated.services.filter((s) => !idsToRemove.has(s.id));
  updated.contexts = updated.contexts.filter((c) => !idsToRemove.has(c.id));

  // Clean up mocks for removed components
  idsToRemove.forEach((removedId) => {
    delete updated.mocks.components[removedId];
    delete updated.mocks.services[removedId];
    delete updated.mocks.contexts[removedId];
  });

  updated.updatedAt = Date.now();
  return updated;
}

/**
 * Move a node to a new parent
 */
export function moveNode(
  instance: InstanceJSON,
  id: string,
  newParentId: string | null
): InstanceJSON {
  const tree = new Tree(instance);

  // Check for cycles
  if (newParentId && tree.wouldCreateCycle(id, newParentId)) {
    throw new Error('Cannot move node: would create a cycle');
  }

  const node = tree.getNode(id);
  if (!node) {
    throw new Error(`Node ${id} not found`);
  }

  // Only components and folders can have parents
  if (node.type !== 'component' && node.type !== 'folder') {
    throw new Error(`Cannot move ${node.type} nodes`);
  }

  // Validate new parent type
  if (newParentId) {
    const newParent = tree.getNode(newParentId);
    if (!newParent) {
      throw new Error(`Parent node ${newParentId} not found`);
    }

    // Components can only be moved to folders or root
    if (node.type === 'component' && newParent.type !== 'folder') {
      throw new Error('Components can only be moved to folders');
    }
  }

  const updated = { ...instance };

  if (node.type === 'component') {
    updated.components = updated.components.map((c) =>
      c.id === id ? { ...c, parentId: newParentId || undefined } : c
    );
  }

  updated.updatedAt = Date.now();
  return updated;
}

/**
 * Rename a node
 */
export function renameNode(instance: InstanceJSON, id: string, newName: string): InstanceJSON {
  const updated = { ...instance };

  // Find and update the node
  updated.folders = updated.folders.map((f) => (f.id === id ? { ...f, name: newName } : f));
  updated.components = updated.components.map((c) => (c.id === id ? { ...c, name: newName } : c));
  updated.services = updated.services.map((s) => (s.id === id ? { ...s, name: newName } : s));
  updated.contexts = updated.contexts.map((c) => (c.id === id ? { ...c, name: newName } : c));

  updated.updatedAt = Date.now();
  return updated;
}

/**
 * Update node spec
 */
export function updateNode(instance: InstanceJSON, id: string, spec: NodeSpec): InstanceJSON {
  const updated = { ...instance };

  // Find and update the node
  updated.folders = updated.folders.map((f) => (f.id === id ? (spec as FolderSpecJSON) : f));
  updated.components = updated.components.map((c) =>
    c.id === id ? (spec as ComponentSpecJSON) : c
  );
  updated.services = updated.services.map((s) => (s.id === id ? (spec as any) : s));
  updated.contexts = updated.contexts.map((c) => (c.id === id ? (spec as any) : c));

  updated.updatedAt = Date.now();
  return updated;
}

/**
 * Duplicate a node
 */
export function duplicateNode(instance: InstanceJSON, id: string): InstanceJSON {
  const tree = new Tree(instance);
  const node = tree.getNode(id);

  if (!node) {
    throw new Error(`Node ${id} not found`);
  }

  // Create a copy with new ID
  const newId = crypto.randomUUID();
  const newSpec = JSON.parse(JSON.stringify(node.spec));
  newSpec.id = newId;
  newSpec.name = `${node.spec.name} (Copy)`;

  return addNode(instance, node.parentId, node.type, newSpec);
}

/**
 * Reorder children of a node
 */
export function reorderChildren(
  instance: InstanceJSON,
  _parentId: string | null,
  _childIds: string[]
): InstanceJSON {
  // This would be used for drag-and-drop reordering
  // Implementation depends on how we want to store order
  // For now, we rely on array order in the instance

  const updated = { ...instance };
  updated.updatedAt = Date.now();
  return updated;
}
