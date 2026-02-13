/**
 * Dialog for creating a new instance
 */

import { useState } from 'react';
import './CreateInstanceDialog.css';

interface CreateInstanceDialogProps {
  onConfirm: (name: string) => void;
  onCancel: () => void;
}

export function CreateInstanceDialog({ onConfirm, onCancel }: CreateInstanceDialogProps) {
  const [name, setName] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim()) {
      onConfirm(name.trim());
    }
  }

  return (
    <div className="dialog-overlay" onClick={onCancel}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <h2>Create New Project</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="project-name">Project Name</label>
            <input
              id="project-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Awesome App"
              autoFocus
              required
            />
          </div>
          <div className="dialog-actions">
            <button type="button" className="btn-secondary" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={!name.trim()}>
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
