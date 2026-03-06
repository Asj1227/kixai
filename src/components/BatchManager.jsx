import { useState } from 'react';
import { Plus, FolderOpen, Trash2, Edit2, Check, X } from 'lucide-react';
import './BatchManager.css';

export default function BatchManager({ batches, activeBatchId, onSelectBatch, onCreateBatch, onDeleteBatch, onRenameBatch }) {
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');

  function startEdit(batch) {
    setEditingId(batch.id);
    setEditValue(batch.name);
  }

  function confirmEdit(id) {
    if (editValue.trim()) onRenameBatch(id, editValue.trim());
    setEditingId(null);
  }

  function cancelEdit() { setEditingId(null); }

  return (
    <div className="batch-manager">
      <div className="batch-manager-inner">
        <div className="batch-label">
          <FolderOpen size={14} />
          Batches
        </div>

        <div className="batch-tabs">
          {batches.map(batch => (
            <div
              key={batch.id}
              className={`batch-tab ${activeBatchId === batch.id ? 'active' : ''}`}
            >
              {editingId === batch.id ? (
                <div className="batch-edit-row">
                  <input
                    className="batch-edit-input"
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') confirmEdit(batch.id); if (e.key === 'Escape') cancelEdit(); }}
                    autoFocus
                  />
                  <button className="batch-icon-btn success" onClick={() => confirmEdit(batch.id)} title="Save"><Check size={12} /></button>
                  <button className="batch-icon-btn" onClick={cancelEdit} title="Cancel"><X size={12} /></button>
                </div>
              ) : (
                <button className="batch-tab-btn" onClick={() => onSelectBatch(batch.id)}>
                  <span className="batch-count">{batch.invoices.length}</span>
                  {batch.name}
                </button>
              )}

              {editingId !== batch.id && (
                <div className="batch-tab-actions">
                  <button className="batch-icon-btn" onClick={() => startEdit(batch)} title="Rename">
                    <Edit2 size={12} />
                  </button>
                  {batches.length > 1 && (
                    <button className="batch-icon-btn danger" onClick={() => onDeleteBatch(batch.id)} title="Delete batch">
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}

          <button className="batch-add-btn" onClick={onCreateBatch} title="New batch">
            <Plus size={16} />
            New Batch
          </button>
        </div>
      </div>
    </div>
  );
}
