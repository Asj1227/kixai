import './SummaryPanel.css';

const WHO_CONFIG = [
  { key: 'Maryam', cls: 'maryam' },
  { key: 'Rabaa',  cls: 'rabaa' },
  { key: 'Hoor',   cls: 'hoor' },
  { key: 'Shamma', cls: 'shamma' },
];

function parseCurrency(val) {
  if (!val) return 0;
  const n = parseFloat(String(val).replace(/[^0-9.]/g, ''));
  return isNaN(n) ? 0 : n;
}

function fmt(n) {
  return `AED${n.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function SummaryPanel({ invoices }) {
  const totals = {};
  let grandTotal = 0;

  invoices.forEach(inv => {
    const amount = parseCurrency(inv.amountWithVat);
    grandTotal += amount;
    if (inv.who && inv.who.trim()) {
      const k = inv.who.trim();
      totals[k] = (totals[k] || 0) + amount;
    }
  });

  const whoEntries = WHO_CONFIG.filter(w => totals[w.key] !== undefined)
    .concat(
      Object.keys(totals)
        .filter(k => !WHO_CONFIG.find(w => w.key === k))
        .map(k => ({ key: k, cls: 'custom' }))
    );

  return (
    <div className="summary-panel card">
      <div className="summary-panel-header">
        <span className="summary-title">Summary</span>
        <span className="badge badge-aqua">{invoices.length} invoices</span>
      </div>

      <div className="summary-rows">
        {whoEntries.length === 0 ? (
          <p className="summary-empty">Assign "Who?" values to see totals</p>
        ) : (
          whoEntries.map(w => (
            <div key={w.key} className={`summary-row summary-${w.cls}`}>
              <span className="summary-person">{w.key} Total</span>
              <span className="summary-amount">{fmt(totals[w.key] || 0)}</span>
            </div>
          ))
        )}
      </div>

      <div className="divider" style={{ margin: '12px 0' }} />

      <div className="summary-grand">
        <span className="grand-label">Total Budget</span>
        <span className="grand-value">{fmt(grandTotal)}</span>
      </div>
    </div>
  );
}
