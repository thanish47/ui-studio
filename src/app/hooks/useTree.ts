/**
 * Hook for managing tree state
 */

import { useMemo, useState, useCallback } from 'react';
import { Tree } from '@/core/graph';
import type { InstanceJSON } from '@/core/schema';

export function useTree(instance: InstanceJSON | null) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Build tree from instance
  const tree = useMemo(() => {
    if (!instance) return null;
    return new Tree(instance);
  }, [instance]);

  // Toggle expand/collapse for a node
  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Expand a node
  const expand = useCallback((id: string) => {
    setExpandedIds((prev) => new Set(prev).add(id));
  }, []);

  // Collapse a node
  const collapse = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  // Expand all nodes
  const expandAll = useCallback(() => {
    if (!tree) return;
    const allIds = tree.getAllNodes().map((n) => n.id);
    setExpandedIds(new Set(allIds));
  }, [tree]);

  // Collapse all nodes
  const collapseAll = useCallback(() => {
    setExpandedIds(new Set());
  }, []);

  // Check if node is expanded
  const isExpanded = useCallback(
    (id: string) => {
      return expandedIds.has(id);
    },
    [expandedIds]
  );

  // Get visible nodes (for virtualization)
  const getVisibleNodes = useCallback(() => {
    if (!tree) return [];

    const visible: Array<{ node: any; depth: number }> = [];

    const traverse = (id: string, depth: number) => {
      const node = tree.getNode(id);
      if (!node) return;

      visible.push({ node, depth });

      // Only traverse children if node is expanded
      if (expandedIds.has(id)) {
        node.children.forEach((childId) => traverse(childId, depth + 1));
      }
    };

    tree.getRoots().forEach((root) => traverse(root.id, 0));

    return visible;
  }, [tree, expandedIds]);

  return {
    tree,
    expandedIds,
    toggleExpanded,
    expand,
    collapse,
    expandAll,
    collapseAll,
    isExpanded,
    getVisibleNodes,
  };
}
