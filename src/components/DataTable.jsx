export default function DataTable({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem 2rem', color: 'var(--text-muted)' }}>
        <p>No extracted data available yet.</p>
        <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Upload invoices to see extracted data here.</p>
      </div>
    );
  }

  return (
    <div className="glass-panel" style={{ overflowX: 'auto' }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Extracted Bill Data</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--surface-border)', color: 'var(--text-muted)' }}>
            <th style={{ padding: '0.75rem 1rem', fontWeight: '500' }}>Source File</th>
            <th style={{ padding: '0.75rem 1rem', fontWeight: '500' }}>Bill Name</th>
            <th style={{ padding: '0.75rem 1rem', fontWeight: '500' }}>Products</th>
            <th style={{ padding: '0.75rem 1rem', fontWeight: '500' }}>Tax</th>
            <th style={{ padding: '0.75rem 1rem', fontWeight: '500' }}>Total Cost</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem' }}>{row.sourceFile}</td>
              <td style={{ padding: '0.75rem 1rem', fontWeight: '500' }}>{row.billName || 'N/A'}</td>
              <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem' }}>
                {row.products && row.products.length > 0 ? (
                  <ul style={{ paddingLeft: '1.25rem', margin: 0 }}>
                    {row.products.map((p, idx) => (
                      <li key={idx}>
                        {p.name} {p.cost ? `($${p.cost})` : ''}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>No products listed</span>
                )}
              </td>
              <td style={{ padding: '0.75rem 1rem' }}>{row.tax !== null && row.tax !== undefined ? `$${row.tax}` : 'N/A'}</td>
              <td style={{ padding: '0.75rem 1rem', fontWeight: '600', color: 'var(--success)' }}>
                {row.totalCost !== null && row.totalCost !== undefined ? `$${row.totalCost}` : 'N/A'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
