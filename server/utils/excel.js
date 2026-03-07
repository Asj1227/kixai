import XLSX from 'xlsx';

export function generateExcelBuffer(invoices) {
  const data = invoices.map((inv, index) => ({
    "ID": index + 1,
    "Vendor": inv.vendorName || '-',
    "Date": inv.date || '-',
    "Total": inv.totalAmount || 0,
    "Currency": inv.currency || 'USD',
    "Invoice #": inv.invoiceNumber || '-',
    "Who?": inv.who || '-',
    "Description": inv.description || '-'
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Invoices");

  // Generate buffer
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  return buffer;
}
