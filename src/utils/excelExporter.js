import * as XLSX from 'xlsx';

const WHO_COLORS = {
  maryam: { fgColor: { rgb: 'FFF3CD' }, fontColor: { rgb: '856404' } },
  rabaa:   { fgColor: { rgb: 'D1FAE5' }, fontColor: { rgb: '065F46' } },
  hoor:    { fgColor: { rgb: 'EDE9FE' }, fontColor: { rgb: '5B21B6' } },
  shamma:  { fgColor: { rgb: 'FFEDD5' }, fontColor: { rgb: '9A3412' } },
};

function getWhoStyle(who) {
  if (!who) return null;
  return WHO_COLORS[who.toLowerCase()] || null;
}

function parseCurrency(val) {
  if (!val) return 0;
  const num = parseFloat(String(val).replace(/[^0-9.]/g, ''));
  return isNaN(num) ? 0 : num;
}

export function exportToExcel(invoices, batchName = 'KIXAI Invoices') {
  const wb = XLSX.utils.book_new();
  const ws = {};

  // ── Column widths ──
  ws['!cols'] = [
    { wch: 14 }, // Invoice Date
    { wch: 22 }, // Invoice Number
    { wch: 40 }, // Invoice Description
    { wch: 14 }, // Vat. Amount
    { wch: 16 }, // Amount with Vat.
    { wch: 30 }, // Vendor Name
    { wch: 12 }, // Who?
    { wch: 2 },  // spacer
    { wch: 18 }, // Summary label
    { wch: 16 }, // Summary value
  ];

  // ── Helper: set a cell ──
  function setCell(row, col, value, style = {}) {
    const addr = XLSX.utils.encode_cell({ r: row, c: col });
    ws[addr] = { v: value, t: typeof value === 'number' ? 'n' : 's', s: style };
  }

  // ── Header row ──
  const headers = [
    'Invoice Date', 'Invoice Number', 'Invoice Description',
    'Vat. Amount', 'Amount with Vat.', 'Vendor Name', 'Who?'
  ];

  const headerStyle = {
    font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
    fill: { fgColor: { rgb: '0A0F2E' } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: {
      top: { style: 'thin', color: { rgb: 'CCCCCC' } },
      bottom: { style: 'thin', color: { rgb: 'CCCCCC' } },
      left: { style: 'thin', color: { rgb: 'CCCCCC' } },
      right: { style: 'thin', color: { rgb: 'CCCCCC' } },
    }
  };

  headers.forEach((h, c) => setCell(0, c, h, headerStyle));

  // ── Data rows ──
  const bodyCellStyle = {
    alignment: { vertical: 'center', wrapText: true },
    border: {
      top: { style: 'thin', color: { rgb: 'E4E8F0' } },
      bottom: { style: 'thin', color: { rgb: 'E4E8F0' } },
      left: { style: 'thin', color: { rgb: 'E4E8F0' } },
      right: { style: 'thin', color: { rgb: 'E4E8F0' } },
    }
  };

  invoices.forEach((inv, i) => {
    const r = i + 1;
    const who = (inv.who || '').trim();
    const whoStyle = getWhoStyle(who);

    const rowData = [
      inv.invoiceDate || '',
      inv.invoiceNumber || '',
      inv.invoiceDescription || '',
      inv.vatAmount || '',
      inv.amountWithVat || '',
      inv.vendorName || '',
      who,
    ];

    rowData.forEach((val, c) => {
      const style = { ...bodyCellStyle };
      if (c === 6 && whoStyle) {
        style.fill = { fgColor: whoStyle.fgColor };
        style.font = { bold: true, color: whoStyle.fontColor };
      }
      setCell(r, c, val, style);
    });
  });

  // ── Summary section (columns H-I, starting row 0) ──
  const totals = {};
  let grandTotal = 0;

  invoices.forEach(inv => {
    const amount = parseCurrency(inv.amountWithVat);
    grandTotal += amount;
    if (inv.who && inv.who.trim()) {
      const key = inv.who.trim();
      totals[key] = (totals[key] || 0) + amount;
    }
  });

  const summaryHeaderStyle = {
    font: { bold: true, sz: 11, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '141A45' } },
    alignment: { horizontal: 'center' },
    border: bodyCellStyle.border,
  };

  setCell(0, 8, 'Person', summaryHeaderStyle);
  setCell(0, 9, 'Total (AED)', summaryHeaderStyle);

  let sRow = 1;
  Object.entries(totals).forEach(([person, total]) => {
    const whoStyle = getWhoStyle(person);
    const labelStyle = {
      font: { bold: true, color: whoStyle ? whoStyle.fontColor : { rgb: '000000' } },
      fill: whoStyle ? { fgColor: whoStyle.fgColor } : {},
      alignment: { horizontal: 'center' },
      border: bodyCellStyle.border,
    };
    const valStyle = {
      font: { bold: true },
      fill: whoStyle ? { fgColor: whoStyle.fgColor } : {},
      alignment: { horizontal: 'right' },
      border: bodyCellStyle.border,
      numFmt: '"AED"#,##0.00',
    };
    setCell(sRow, 8, `${person} Total`, labelStyle);
    setCell(sRow, 9, total, valStyle);
    sRow++;
  });

  // ── Grand Total row ──
  const lastDataRow = invoices.length + 1;
  const grandTotalRow = Math.max(lastDataRow + 1, sRow + 1);

  const totalLabelStyle = {
    font: { bold: true, sz: 16, color: { rgb: '0A0F2E' } },
    alignment: { horizontal: 'left', vertical: 'center' },
  };
  const totalValueStyle = {
    font: { bold: true, sz: 16, color: { rgb: 'DC2626' } },
    alignment: { horizontal: 'left', vertical: 'center' },
    numFmt: '"AED"#,##0.00',
  };

  setCell(grandTotalRow, 0, 'Total Budget', totalLabelStyle);
  setCell(grandTotalRow, 2, grandTotal, totalValueStyle);

  // ── Row heights ──
  ws['!rows'] = [{ hpt: 28 }]; // header row height
  for (let i = 1; i <= invoices.length; i++) {
    ws['!rows'][i] = { hpt: 22 };
  }
  ws['!rows'][grandTotalRow] = { hpt: 36 };

  // Set sheet range
  const maxRow = Math.max(invoices.length + 1, sRow, grandTotalRow);
  ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: maxRow, c: 9 } });

  XLSX.utils.book_append_sheet(wb, ws, batchName.slice(0, 31));

  // Download
  const filename = `${batchName.replace(/[^a-zA-Z0-9 _-]/g, '_')}_${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}.xlsx`;
  XLSX.writeFile(wb, filename);

  return filename;
}
