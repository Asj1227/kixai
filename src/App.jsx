import { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import ApiKeyModal from './components/ApiKeyModal';
import BatchManager from './components/BatchManager';
import UploadZone from './components/UploadZone';
import InvoiceTable from './components/InvoiceTable';
import SummaryPanel from './components/SummaryPanel';
import Chatbot from './components/Chatbot';
import WhatsAppPage from './components/WhatsAppPage';
import { extractInvoiceData, checkHealth } from './utils/apiService';
import { exportToExcel } from './utils/excelExporter';
import { isDuplicate } from './utils/duplicateDetector';
import './index.css';
import './App.css';

// ── Toast system ──────────────────────────────────────────────
function Toast({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {t.type === 'success' && '✓'}
          {t.type === 'error' && '✗'}
          {t.type === 'info' && 'ℹ'}
          {t.message}
        </div>
      ))}
    </div>
  );
}

// ── Health Dashboard ──────────────────────────────────────────
function HealthDashboard({ health, onRefresh }) {
  const isOk = health.status === 'ok';
  const aiStatus = health.services?.ai || 'unknown';
  
  return (
    <div className="health-dashboard" style={{ background: '#fff', border: '1px solid var(--border-light)', borderRadius: '12px', marginBottom: '20px', padding: '16px' }}>
      <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-primary)' }}>System Connectivity</h4>
        <button onClick={onRefresh} title="Refresh Health" style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', color: 'var(--text-secondary)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
        </button>
      </div>
      
      <div style={{ display: 'grid', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Backend Status</span>
          <span style={{ fontWeight: 600, color: isOk ? '#059669' : '#dc2626' }}>
            {isOk ? 'Connected' : 'Offline'}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>AI Engine (GPT-4o-mini)</span>
          <span style={{ fontWeight: 600, color: aiStatus === 'ok' ? '#059669' : aiStatus === 'degraded' ? '#ea580c' : '#dc2626' }}>
            {aiStatus.toUpperCase()}
          </span>
        </div>
        {health.message && (
          <div style={{ marginTop: '8px', padding: '6px', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '4px', fontSize: '0.7rem', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <AlertCircle size={12} /> {health.message}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────
function newBatch(name) {
  return { id: `batch-${Date.now()}`, name, invoices: [] };
}

function fileToBase64(file) {
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result.split(',')[1]);
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });
}

const INITIAL_BATCH = newBatch('Batch 1');

// ── App ───────────────────────────────────────────────────────
export default function App() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('kixai_api_key') || '');
  const [showApiModal, setShowApiModal] = useState(false);
  const [activePage, setActivePage] = useState('analyzer');

  const [batches, setBatches] = useState([INITIAL_BATCH]);
  const [activeBatchId, setActiveBatchId] = useState(INITIAL_BATCH.id);

  const [fileQueue, setFileQueue] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [health, setHealth] = useState({ status: 'unknown', services: {} });

  // ── Health Check ──
  const fetchHealth = useCallback(async () => {
    const res = await checkHealth(apiKey);
    setHealth(res);
  }, [apiKey]);

  useEffect(() => {
    let mounted = true;
    async function doFetch() {
      const res = await checkHealth(apiKey);
      if (mounted) setHealth(res);
    }
    doFetch();
    const interval = setInterval(doFetch, 30000);
    return () => { mounted = false; clearInterval(interval); };
  }, [apiKey]);

  // ── Toast helpers ──
  function showToast(message, type = 'info', duration = 3500) {
    const id = Date.now();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), duration);
  }

  // ── API key ──
  function handleSaveApiKey(key) {
    setApiKey(key);
    localStorage.setItem('kixai_api_key', key);
    if (key) showToast('API key saved successfully', 'success');
    else showToast('API key cleared', 'info');
  }

  // ── Active batch ──
  const activeBatch = batches.find(b => b.id === activeBatchId) || batches[0];
  const activeInvoices = activeBatch?.invoices || [];

  function updateActiveBatch(invoices) {
    setBatches(prev => prev.map(b => b.id === activeBatchId ? { ...b, invoices } : b));
  }

  // ── Batch management ──
  function handleCreateBatch() {
    const n = newBatch(`Batch ${batches.length + 1}`);
    setBatches(prev => [...prev, n]);
    setActiveBatchId(n.id);
    setFileQueue([]);
    showToast(`Created "${n.name}"`, 'success');
  }

  function handleDeleteBatch(id) {
    if (batches.length <= 1) return;
    setBatches(prev => prev.filter(b => b.id !== id));
    if (activeBatchId === id) setActiveBatchId(batches.find(b => b.id !== id)?.id);
    showToast('Batch deleted', 'info');
  }

  function handleRenameBatch(id, name) {
    setBatches(prev => prev.map(b => b.id === id ? { ...b, name } : b));
  }

  function handleSelectBatch(id) {
    setActiveBatchId(id);
    setFileQueue([]);
  }

  // ── File handling ──
  function handleFilesAdded(files) {
    const entries = files.map(f => ({
      id: `file-${Date.now()}-${Math.random()}`,
      file: f,
      status: 'idle',
      error: null,
    }));

    setFileQueue(prev => [...prev, ...entries]);
    processFiles(entries);
  }

  function handleRemoveFile(fileId) {
    setFileQueue(prev => prev.filter(f => f.id !== fileId));
  }

  function updateFileStatus(fileId, status, error = null) {
    setFileQueue(prev => prev.map(f => f.id === fileId ? { ...f, status, error } : f));
  }

  function handleRetryFile(fileId) {
    const entry = fileQueue.find(f => f.id === fileId);
    if (entry) processFiles([entry]);
  }

  async function processFiles(entries) {
    setIsProcessing(true);
    let successCount = 0;
    let dupCount = 0;
    let errorCount = 0;

    // Process files sequentially to avoid overloading backend
    for (const entry of entries) {
      updateFileStatus(entry.id, 'processing');
      const { file } = entry;

      try {
        const raw = await extractInvoiceData(file, apiKey);

        // Check for duplicate
        let added = false;
        setBatches(prev => {
          return prev.map(b => {
            if (b.id !== activeBatchId) return b;
            let currentInvoices = [...b.invoices];
            
            if (isDuplicate(raw, currentInvoices)) {
              dupCount++;
            } else {
              currentInvoices.push({ id: `inv-${Date.now()}-${Math.random()}`, ...raw });
              added = true;
              successCount++;
            }
            return { ...b, invoices: currentInvoices };
          });
        });

        updateFileStatus(entry.id, added ? 'done' : 'duplicate');

      } catch (err) {
        console.error('Extraction error:', err);
        updateFileStatus(entry.id, 'error', err.message);
        errorCount++;
      }
    }

    setIsProcessing(false);

    // Show summary toast
    if (successCount > 0) showToast(`Added ${successCount} invoice${successCount !== 1 ? 's' : ''}`, 'success');
    if (dupCount > 0) showToast(`Skipped ${dupCount} duplicate${dupCount !== 1 ? 's' : ''}`, 'info');
    if (errorCount > 0) showToast(`${errorCount} file${errorCount !== 1 ? 's' : ''} failed to process`, 'error');
  }

  // ── Invoice table actions ──
  function handleUpdateInvoice(idx, field, value) {
    const updated = activeInvoices.map((inv, i) => i === idx ? { ...inv, [field]: value } : inv);
    updateActiveBatch(updated);
  }

  function handleDeleteInvoice(idx) {
    const updated = activeInvoices.filter((_, i) => i !== idx);
    updateActiveBatch(updated);
    showToast('Invoice removed', 'info');
  }

  function handleUpdateInvoices(newList) {
    updateActiveBatch(newList);
    showToast('Invoice data updated by AI', 'success');
  }

  // ── Export ──
  function handleExport() {
    if (activeInvoices.length === 0) {
      showToast('No invoices to export', 'error');
      return;
    }
    try {
      const filename = exportToExcel(activeInvoices, activeBatch.name);
      showToast(`Exported: ${filename}`, 'success');
    } catch (err) {
      showToast('Export failed: ' + err.message, 'error');
    }
  }

  // ── Render ──
  return (
    <div className="app-root">
      <Header
        apiKey={apiKey}
        onOpenApiModal={() => setShowApiModal(true)}
        activePage={activePage}
        onChangePage={setActivePage}
        health={health}
      />

      {activePage === 'analyzer' ? (
        <>
          <BatchManager
            batches={batches}
            activeBatchId={activeBatchId}
            onSelectBatch={handleSelectBatch}
            onCreateBatch={handleCreateBatch}
            onDeleteBatch={handleDeleteBatch}
            onRenameBatch={handleRenameBatch}
          />

          <main className="app-main">
            <div className="app-content">
              {/* Left: Upload + Table */}
              <div className="app-left">
                <section className="app-section">
                  <div className="section-header">
                    <h2 className="section-title">
                      <div className="icon-wrap">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M8 1v10M4 7l4-6 4 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                          <path d="M2 15h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                      </div>
                      Upload Invoices
                    </h2>
                  </div>
                  <UploadZone
                    fileQueue={fileQueue}
                    onFilesAdded={handleFilesAdded}
                    onRemoveFile={handleRemoveFile}
                    onRetryFile={handleRetryFile}
                    isProcessing={isProcessing}
                  />
                </section>

                <section className="app-section">
                  <InvoiceTable
                    invoices={activeInvoices}
                    onUpdateInvoice={handleUpdateInvoice}
                    onDeleteInvoice={handleDeleteInvoice}
                    onExport={handleExport}
                  />
                </section>
              </div>

              {/* Right: Summary */}
              <aside className="app-right">
                <HealthDashboard health={health} onRefresh={fetchHealth} />
                <SummaryPanel invoices={activeInvoices} />
              </aside>
            </div>
          </main>
        </>
      ) : (
        <main className="app-main">
          <div className="app-content single">
            <WhatsAppPage />
          </div>
        </main>
      )}

      <Chatbot
        invoices={activeInvoices}
        apiKey={apiKey}
        onUpdateInvoices={handleUpdateInvoices}
      />

      {showApiModal && (
        <ApiKeyModal
          currentKey={apiKey}
          onSave={handleSaveApiKey}
          onClose={() => setShowApiModal(false)}
        />
      )}

      <Toast toasts={toasts} />
    </div>
  );
}
