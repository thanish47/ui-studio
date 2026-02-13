/**
 * Single instance card
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { InstanceJSON } from '../../core/schema';
import './InstanceCard.css';

interface InstanceCardProps {
  instance: InstanceJSON;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}

export function InstanceCard({ instance, onDelete, onDuplicate }: InstanceCardProps) {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  function formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  function handleOpen() {
    navigate(`/builder/${instance.id}`);
  }

  return (
    <div className="instance-card">
      <div className="instance-card-header">
        <h3>{instance.name}</h3>
        <button
          className="menu-btn"
          onClick={() => setShowMenu(!showMenu)}
          aria-label="Options"
        >
          ⋮
        </button>
        {showMenu && (
          <div className="instance-menu">
            <button onClick={() => {
              setShowMenu(false);
              onDuplicate(instance.id);
            }}>
              Duplicate
            </button>
            <button onClick={() => {
              setShowMenu(false);
              onDelete(instance.id);
            }} className="danger">
              Delete
            </button>
          </div>
        )}
      </div>

      <div className="instance-card-body">
        <div className="instance-stats">
          <div className="stat">
            <span className="stat-label">Components</span>
            <span className="stat-value">{instance.components.length}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Services</span>
            <span className="stat-value">{instance.services.length}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Contexts</span>
            <span className="stat-value">{instance.contexts.length}</span>
          </div>
        </div>

        <div className="instance-metadata">
          <span className="layout-badge">{instance.appSpec.layout}</span>
          <span className="updated-date">Updated {formatDate(instance.updatedAt)}</span>
        </div>
      </div>

      <div className="instance-card-footer">
        <button className="btn-open" onClick={handleOpen}>
          Open
        </button>
      </div>
    </div>
  );
}
