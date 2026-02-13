/**
 * Tree data structure for representing instance hierarchy
 */

import type {
  InstanceJSON,
  FolderSpecJSON,
  ComponentSpecJSON,
  ServiceSpecJSON,
  ContextSpec,
} from '../schema/types';

export type NodeSpec = FolderSpecJSON | ComponentSpecJSON | ServiceSpecJSON | ContextSpec;

export interface TreeNode {
  id: string;
  type: 'folder' | 'component' | 'service' | 'context';
  name: string;
  parentId: string | null;
  children: string[]; // IDs of children
  spec: NodeSpec;
}

export class Tree {
  private nodes: Map<string, TreeNode>;
  private rootIds: string[]; // Multiple roots (folders, services, contexts at top level)

  constructor(instance: InstanceJSON) {
    this.nodes = new Map();
    this.rootIds = [];
    this.buildTree(instance);
  }

  /**
   * Get node by ID
   */
  getNode(id: string): TreeNode | undefined {
    return this.nodes.get(id);
  }

  /**
   * Get all nodes
   */
  getAllNodes(): TreeNode[] {
    return Array.from(this.nodes.values());
  }

  /**
   * Get root nodes
   */
  getRoots(): TreeNode[] {
    return this.rootIds.map((id) => this.nodes.get(id)!).filter(Boolean);
  }

  /**
   * Get children of a node
   */
  getChildren(id: string): TreeNode[] {
    const node = this.nodes.get(id);
    return node ? node.children.map((childId) => this.nodes.get(childId)!).filter(Boolean) : [];
  }

  /**
   * Get parent of a node
   */
  getParent(id: string): TreeNode | undefined {
    const node = this.nodes.get(id);
    return node?.parentId ? this.nodes.get(node.parentId) : undefined;
  }

  /**
   * Get path from root to node
   */
  getPath(id: string): TreeNode[] {
    const path: TreeNode[] = [];
    let current = this.nodes.get(id);
    while (current) {
      path.unshift(current);
      current = current.parentId ? this.nodes.get(current.parentId) : undefined;
    }
    return path;
  }

  /**
   * Get depth of node (0 for root)
   */
  getDepth(id: string): number {
    return this.getPath(id).length - 1;
  }

  /**
   * Get max depth of entire tree
   */
  getMaxDepth(): number {
    let maxDepth = 0;
    for (const [id] of this.nodes) {
      const depth = this.getDepth(id);
      if (depth > maxDepth) {
        maxDepth = depth;
      }
    }
    return maxDepth;
  }

  /**
   * Validate that tree depth doesn't exceed limit
   */
  validateDepth(maxDepth: number = 10): boolean {
    return this.getMaxDepth() <= maxDepth;
  }

  /**
   * Check if moving a node would create a cycle
   */
  wouldCreateCycle(nodeId: string, newParentId: string): boolean {
    // Can't move node to itself
    if (nodeId === newParentId) {
      return true;
    }

    // Check if newParentId is a descendant of nodeId
    let current = this.nodes.get(newParentId);
    while (current) {
      if (current.id === nodeId) {
        return true;
      }
      current = current.parentId ? this.nodes.get(current.parentId) : undefined;
    }

    return false;
  }

  /**
   * Get descendants of a node (all children recursively)
   */
  getDescendants(id: string): TreeNode[] {
    const descendants: TreeNode[] = [];
    const queue: string[] = [id];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const node = this.nodes.get(currentId);

      if (node) {
        descendants.push(node);
        queue.push(...node.children);
      }
    }

    // Remove the node itself from descendants
    return descendants.filter((node) => node.id !== id);
  }

  /**
   * Get siblings of a node
   */
  getSiblings(id: string): TreeNode[] {
    const node = this.nodes.get(id);
    if (!node) return [];

    if (node.parentId) {
      const parent = this.nodes.get(node.parentId);
      return parent
        ? parent.children.map((childId) => this.nodes.get(childId)!).filter((n) => n && n.id !== id)
        : [];
    } else {
      // Root node - siblings are other root nodes
      return this.rootIds.map((rootId) => this.nodes.get(rootId)!).filter((n) => n && n.id !== id);
    }
  }

  /**
   * Convert tree to flat array (depth-first)
   */
  toFlatArray(): TreeNode[] {
    const result: TreeNode[] = [];

    const traverse = (id: string) => {
      const node = this.nodes.get(id);
      if (node) {
        result.push(node);
        node.children.forEach(traverse);
      }
    };

    this.rootIds.forEach(traverse);
    return result;
  }

  /**
   * Build tree from instance
   */
  private buildTree(instance: InstanceJSON): void {
    // Create folder nodes
    instance.folders.forEach((folder) => {
      this.nodes.set(folder.id, {
        id: folder.id,
        type: 'folder',
        name: folder.name,
        parentId: null,
        children: [],
        spec: folder,
      });
      this.rootIds.push(folder.id);
    });

    // Create component nodes
    instance.components.forEach((component) => {
      this.nodes.set(component.id, {
        id: component.id,
        type: 'component',
        name: component.name,
        parentId: component.parentId || null,
        children: [],
        spec: component,
      });

      // Add to parent's children or root
      if (component.parentId) {
        const parent = this.nodes.get(component.parentId);
        if (parent) {
          parent.children.push(component.id);
        }
      } else {
        this.rootIds.push(component.id);
      }
    });

    // Create service nodes
    instance.services.forEach((service) => {
      this.nodes.set(service.id, {
        id: service.id,
        type: 'service',
        name: service.name,
        parentId: null,
        children: [],
        spec: service,
      });
      this.rootIds.push(service.id);
    });

    // Create context nodes
    instance.contexts.forEach((context) => {
      this.nodes.set(context.id, {
        id: context.id,
        type: 'context',
        name: context.name,
        parentId: null,
        children: [],
        spec: context,
      });
      this.rootIds.push(context.id);
    });
  }

  /**
   * Rebuild tree from updated instance
   */
  rebuild(instance: InstanceJSON): void {
    this.nodes.clear();
    this.rootIds = [];
    this.buildTree(instance);
  }
}
