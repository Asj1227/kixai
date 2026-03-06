import { useRef, useState } from 'react';
import { Upload, File, Image, FileText, X, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import './UploadZone.css';

const ACCEPTED_TYPES = {
  'application/pdf': { icon: FileText, label: 'PDF', color: '#dc2626' },
  'image/png':  { icon: Image, label: 'PNG',  color: '#059669' },
  'image/jpeg': { icon: Image, label: 'JPG',  color: '#0284c7' },
  'image/webp': { icon: Image, label: 'WebP', color: '#7c3aed' },
  'image/heic': { icon: Image, label: 'HEIC', color: '#ea580c' },
  'image/heif': { icon: Image, label: 'HEIF', color: '#ea580c' },
};

function FileCard({ fileEntry, onRemove, onRetry }) {
  const { file, status, error } = fileEntry;
  const typeInfo = ACCEPTED_TYPES[file.type] || { icon: File, label: 'FILE', color: '#6b7280' };
  const Icon = typeInfo.icon;
  const isImage = file.type.startsWith('image/');

  const previewUrl = isImage ? URL.createObjectURL(file) : null;

  return (
    <div className={`file-card ${status}`}>
      <div className="file-card-preview">
        {previewUrl ? (
          <img src={previewUrl} alt={file.name} className="file-thumb" />
        ) : (
          <div className="file-icon-wrap" style={{ background: typeInfo.color + '18' }}>
            <Icon size={24} style={{ color: typeInfo.color }} />
          </div>
        )}
        <span className="file-type-badge" style={{ background: typeInfo.color }}>
          {typeInfo.label}
        </span>
      </div>

      <div className="file-card-info">
        <p className="file-name" title={file.name}>{file.name}</p>
        <p className="file-size">{(file.size / 1024).toFixed(0)} KB</p>
        {status === 'error' && error && (
          <p className="file-error-text" style={{ color: '#dc2626', fontSize: '0.65rem', marginTop: '4px', fontWeight: 'bold' }}>
            {error}
          </p>
        )}
      </div>

      <div className="file-card-status">
        {status === 'idle' && <span className="status-dot idle" />}
        {status === 'processing' && <div className="spinner" />}
        {status === 'done' && <CheckCircle size={16} className="status-success" />}
        {status === 'error' && (
          <div className="status-error-wrap" title={error}>
            <div className="status-error-tooltip">{error}</div>
            <AlertCircle size={16} className="status-error" />
          </div>
        )}
        {status === 'duplicate' && (
          <span className="badge badge-gray" style={{ fontSize: '0.65rem' }}>Duplicate</span>
        )}
      </div>

      <button
        className="file-card-remove"
        onClick={() => onRemove(fileEntry.id)}
        title="Remove file"
      >
        <X size={13} />
      </button>
    </div>
  );
}

export default function UploadZone({ fileQueue, onFilesAdded, onRemoveFile, isProcessing }) {
  const inputRef = useRef();
  const [dragging, setDragging] = useState(false);

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    onFilesAdded(files);
  }

  function handleChange(e) {
    const files = Array.from(e.target.files);
    onFilesAdded(files);
    e.target.value = '';
  }

  return (
    <div className="upload-section">
      {/* Drop zone */}
      <div
        className={`upload-zone ${dragging ? 'dragging' : ''} ${isProcessing ? 'processing' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !isProcessing && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.webp,.heic,.heif"
          onChange={handleChange}
          style={{ display: 'none' }}
        />

        <div className="upload-zone-icon">
          {isProcessing
            ? <div className="spinner" style={{ width: 40, height: 40, borderWidth: 4 }} />
            : <Upload size={36} />
          }
        </div>

        <div className="upload-zone-text">
          {isProcessing ? (
            <>
              <h3>Analyzing invoices…</h3>
              <p>KIXAI is reading your files with AI. This may take a moment.</p>
            </>
          ) : (
            <>
              <h3>Drop invoice files here</h3>
              <p>
                or <strong>click to browse</strong> — supports PDF, PNG, JPG, JPEG, WebP, HEIC
                including scanned and handwritten invoices
              </p>
            </>
          )}
        </div>

        <div className="upload-zone-types">
          {Object.values(ACCEPTED_TYPES).map(t => (
            <span key={t.label} className="type-pill" style={{ borderColor: t.color + '40', color: t.color }}>
              {t.label}
            </span>
          ))}
        </div>
      </div>

      {/* File queue */}
      {fileQueue.length > 0 && (
        <div className="file-queue">
          <div className="file-queue-header">
            <span className="section-title" style={{ fontSize: '0.875rem' }}>
              <File size={14} />
              Queued Files ({fileQueue.length})
            </span>
            <div className="file-queue-legend">
              <span><span className="status-dot idle" /> Pending</span>
              <span><CheckCircle size={12} className="status-success" /> Done</span>
              <span><AlertCircle size={12} className="status-error" /> Error</span>
            </div>
          </div>
          <div className="file-grid">
            {fileQueue.map(fe => (
              <FileCard
                key={fe.id}
                fileEntry={fe}
                onRemove={onRemoveFile}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
