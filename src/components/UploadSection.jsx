import { useState, useCallback } from 'react';
import { UploadCloud, Image as ImageIcon, X, Loader2 } from 'lucide-react';

export default function UploadSection({ onImagesUploaded, isProcessing }) {
  const [isDragging, setIsDragging] = useState(false);
  const [images, setImages] = useState([]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const processFiles = useCallback((files) => {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    // Create preview URLs
    const newImages = imageFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).substring(7)
    }));

    setImages(prev => [...prev, ...newImages]);
    onImagesUploaded(imageFiles);
  }, [onImagesUploaded]);

  const removeImage = (idToRemove) => {
    setImages(prev => prev.filter(img => img.id !== idToRemove));
    // We would need to tell parent to remove it too if it was already processed, 
    // but for now we focus on uploading new ones.
  };

  return (
    <div className="glass-panel" style={{ marginBottom: '1.5rem' }}>
      <h2 className="title" style={{ fontSize: '1.5rem' }}>Upload Invoices</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>
        Drag and drop your tax invoices and bills here to extract data.
      </p>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${isDragging ? 'var(--primary)' : 'var(--surface-border)'}`,
          borderRadius: 'var(--radius)',
          padding: '2rem',
          textAlign: 'center',
          backgroundColor: isDragging ? 'rgba(79, 70, 229, 0.1)' : 'rgba(0,0,0,0.2)',
          transition: 'all 0.2s ease',
          cursor: 'pointer',
          position: 'relative'
        }}
        onClick={() => document.getElementById('file-upload').click()}
      >
        <input
          id="file-upload"
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <UploadCloud size={48} color={isDragging ? 'var(--primary)' : 'var(--text-muted)'} style={{ margin: '0 auto 1rem' }} />
        <p style={{ fontWeight: '500' }}>
          {isDragging ? 'Drop images here' : 'Click to browse or drag over'}
        </p>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
          Supports JPG, PNG, WEBP
        </p>
      </div>

      {images.length > 0 && (
        <div style={{ marginTop: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', fontWeight: '500' }}>Uploaded Files</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '1rem' }}>
            {images.map(img => (
              <div key={img.id} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', aspectRatio: '1', border: '1px solid var(--surface-border)' }}>
                <img src={img.preview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button
                  onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}
                  style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', padding: '4px', cursor: 'pointer', color: 'white' }}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            {isProcessing && (
              <div style={{ borderRadius: '8px', border: '1px dashed var(--surface-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', aspectRatio: '1', background: 'rgba(0,0,0,0.2)' }}>
                <Loader2 size={24} color="var(--primary)" style={{ animation: 'spin 1s linear infinite' }} />
              </div>
            )}
          </div>
        </div>
      )}
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
