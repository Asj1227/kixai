import { useState } from 'react';
import { Key, Eye, EyeOff, X, ExternalLink } from 'lucide-react';
import './ApiKeyModal.css';

export default function ApiKeyModal({ currentKey, onSave, onClose }) {
  const [value, setValue] = useState(currentKey || '');
  const [show, setShow] = useState(false);

  function handleSave() {
    onSave(value.trim());
    onClose();
  }

  function handleClear() {
    setValue('');
    onSave('');
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box api-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="api-modal-header">
          <div className="api-modal-icon">
            <Key size={22} />
          </div>
          <div>
            <h3>Gemini API Key</h3>
            <p>Required to power AI invoice extraction</p>
          </div>
          <button className="btn btn-ghost btn-sm modal-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="divider" />

        {/* Key input */}
        <div className="form-group" style={{ marginBottom: 12 }}>
          <label className="form-label">Your API Key</label>
          <div className="api-input-wrap">
            <input
              className="form-input api-key-input"
              type={show ? 'text' : 'password'}
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder="AIza..."
              autoComplete="off"
              spellCheck="false"
            />
            <button
              className="api-toggle-show"
              onClick={() => setShow(s => !s)}
              title={show ? 'Hide key' : 'Show key'}
            >
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div className="api-info-box">
          <p>
            Your API key is stored only in your browser's local storage and is sent
            directly to Google's API. It is never transmitted to any other server.
          </p>
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="api-get-key-link"
          >
            Get a free API key from Google AI Studio <ExternalLink size={12} />
          </a>
        </div>

        <div className="api-modal-actions">
          {currentKey && (
            <button className="btn btn-danger btn-sm" onClick={handleClear}>
              Clear Key
            </button>
          )}
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleSave}
            disabled={!value.trim()}
          >
            Save Key
          </button>
        </div>
      </div>
    </div>
  );
}
