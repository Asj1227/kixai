import { useState, useEffect } from 'react';
import { Key } from 'lucide-react';

export default function ApiKeyConfig({ onKeySubmit }) {
  const [apiKey, setApiKey] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) {
      setApiKey(savedKey);
      setIsSaved(true);
      onKeySubmit(savedKey);
    }
  }, [onKeySubmit]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (apiKey.trim()) {
      localStorage.setItem('gemini_api_key', apiKey.trim());
      setIsSaved(true);
      onKeySubmit(apiKey.trim());
    }
  };

  const handleClear = () => {
    localStorage.removeItem('gemini_api_key');
    setApiKey('');
    setIsSaved(false);
    onKeySubmit('');
  };

  return (
    <div className="glass-panel" style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={{ background: 'var(--primary)', padding: '0.5rem', borderRadius: '8px' }}>
          <Key size={20} color="white" />
        </div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Gemini API Configuration</h2>
      </div>
      
      {!isSaved ? (
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '1rem' }}>
          <input
            type="password"
            className="input"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your Google Gemini API Key"
            required
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn">
            Save Key
          </button>
        </form>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)' }}>
            <span style={{ height: '8px', width: '8px', borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }}></span>
            API Key Configured Successfully
          </div>
          <button onClick={handleClear} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
            Clear Key
          </button>
        </div>
      )}
      <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
        Your key is stored securely in your browser's local storage and is never sent anywhere except directly to Google's API.
      </p>
    </div>
  );
}
