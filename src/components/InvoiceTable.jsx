import { useState, useRef, useEffect } from 'react';
import { Trash2, Download, Edit3, Check, X, ChevronUp, ChevronDown } from 'lucide-react';
import './InvoiceTable.css';

const WHO_OPTIONS = ['', 'Maryam', 'Rabaa', 'Hoor', 'Shamma'];

function whoClass(who) {
  if (!who) return '';
  return `who-${who.toLowerCase()}`;
}

function EditableCell({ value, onChange, type = 'text', isWho = false, confidence = 'high' }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef();

  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);
  useEffect(() => { setDraft(value); }, [value]);

  function commit() {
    onChange(draft);
    setEditing(false);
  }

  function cancel() {
    setDraft(value);
    setEditing(false);
  }

  if (isWho) {
    return (
      <td className={`td-who ${whoClass(value)}`}>
        <select
          className="who-select"
          value={value || ''}
          onChange={e => onChange(e.target.value)}
        >
          {WHO_OPTIONS.map(o => <option key={o} value={o}>{o || '—'}</option>)}
        </select>
      </td>
    );
  }

  if (editing) {
    return (
      <td className="td-editing">
        <div className="cell-edit-wrap">
          <input
            ref={inputRef}
            className="cell-input"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') cancel(); }}
          />
          <button className="cell-btn ok" onClick={commit}><Check size={11} /></button>
          <button className="cell-btn cancel" onClick={cancel}><X size={11} /></button>
        </div>
      </td>
    );
  }

  return (
    <td 
      className={`td-editable ${confidence === 'low' ? 'low-confidence' : ''}`} 
      onClick={() => setEditing(true)}
      title={confidence === 'low' ? 'Low confidence extraction. Please verify.' : ''}
    >
      <span className={`cell-value ${!value ? 'empty' : ''}`}>
        {value || '—'}
      </span>
      <Edit3 size={11} className="cell-edit-icon" />
    </td>
  );
}

export default function InvoiceTable({ invoices, onUpdateInvoice, onDeleteInvoice, onExport }) {
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  const COLUMNS = [
    { key: 'invoiceDate',        label: 'Invoice Date',        width: 110 },
    { key: 'invoiceNumber',      label: 'Invoice Number',      width: 160 },
    { key: 'invoiceDescription', label: 'Invoice Description', width: 280 },
    { key: 'vatAmount',          label: 'Vat. Amount',         width: 110 },
    { key: 'amountWithVat',      label: 'Amount with Vat.',    width: 130 },
    { key: 'vendorName',         label: 'Vendor Name',         width: 200 },
    { key: 'who',                label: 'Who?',                width: 110 },
  ];

  function toggleSort(col) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  }

  const sorted = [...invoices].sort((a, b) => {
    if (!sortCol) return 0;
    const av = (a[sortCol] || '').toLowerCase();
    const bv = (b[sortCol] || '').toLowerCase();
    return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  if (invoices.length === 0) {
    return (
      <div className="table-empty">
        <div className="empty-state">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <rect x="8" y="6" width="32" height="36" rx="4" stroke="#c8d0e8" strokeWidth="2"/>
            <line x1="16" y1="16" x2="32" y2="16" stroke="#c8d0e8" strokeWidth="2" strokeLinecap="round"/>
            <line x1="16" y1="22" x2="32" y2="22" stroke="#c8d0e8" strokeWidth="2" strokeLinecap="round"/>
            <line x1="16" y1="28" x2="26" y2="28" stroke="#c8d0e8" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <h3>No invoices in this batch</h3>
          <p>Upload invoice files above to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <div className="table-header-bar">
        <span className="section-title" style={{ fontSize: '0.875rem' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="1" y="1" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
            <line x1="1" y1="5" x2="15" y2="5" stroke="currentColor" strokeWidth="1.5"/>
            <line x1="5" y1="5" x2="5" y2="15" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
          Invoice Table ({invoices.length} rows)
        </span>
        <button className="btn btn-gold btn-sm" onClick={onExport}>
          <Download size={14} />
          Export Excel
        </button>
      </div>

      <div className="table-scroll">
        <table className="invoice-table">
          <thead>
            <tr>
              <th className="th-row-num">#</th>
              {COLUMNS.map(col => (
                <th
                  key={col.key}
                  style={{ minWidth: col.width }}
                  onClick={() => toggleSort(col.key)}
                  className={sortCol === col.key ? 'sorted' : ''}
                >
                  <span className="th-content">
                    {col.label}
                    <span className="sort-icons">
                      <ChevronUp size={10} opacity={sortCol === col.key && sortDir === 'asc' ? 1 : 0.3} />
                      <ChevronDown size={10} opacity={sortCol === col.key && sortDir === 'desc' ? 1 : 0.3} />
                    </span>
                  </span>
                </th>
              ))}
              <th className="th-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((inv, idx) => {
              const originalIdx = invoices.indexOf(inv);
              return (
                <tr key={inv.id} className={`tr-row ${whoClass(inv.who)}-row`}>
                  <td className="td-row-num">{idx + 1}</td>
                  {COLUMNS.map(col => {
                    if (col.key === 'who') {
                      return (
                        <EditableCell
                          key={col.key}
                          value={inv.who}
                          isWho={true}
                          onChange={val => onUpdateInvoice(originalIdx, 'who', val)}
                        />
                      );
                    }
                    return (
                      <EditableCell
                        key={col.key}
                        value={inv[col.key]}
                        confidence={inv.confidenceScores?.[col.key] || 'high'}
                        onChange={val => onUpdateInvoice(originalIdx, col.key, val)}
                      />
                    );
                  })}
                  <td className="td-actions">
                    <button
                      className="delete-row-btn"
                      onClick={() => onDeleteInvoice(originalIdx)}
                      title="Delete this invoice"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
