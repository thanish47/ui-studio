/**
 * List of instances with cards
 */

import type { InstanceJSON } from '../../core/schema';
import { InstanceCard } from './InstanceCard';
import './InstanceList.css';

interface InstanceListProps {
  instances: InstanceJSON[];
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}

export function InstanceList({ instances, onDelete, onDuplicate }: InstanceListProps) {
  return (
    <div className="instance-list">
      {instances.map((instance) => (
        <InstanceCard
          key={instance.id}
          instance={instance}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
        />
      ))}
    </div>
  );
}
