/**
 * Check if an invoice is a likely duplicate of existing invoices.
 * Returns true if a duplicate is detected.
 */
export function isDuplicate(newInvoice, existingInvoices) {
  if (!existingInvoices || existingInvoices.length === 0) return false;

  return existingInvoices.some(inv => {
    // Match on invoice number + vendor (strong signal)
    const numMatch = inv.invoiceNumber && newInvoice.invoiceNumber &&
      inv.invoiceNumber.trim().toLowerCase() === newInvoice.invoiceNumber.trim().toLowerCase();
    const vendorMatch = inv.vendorName && newInvoice.vendorName &&
      inv.vendorName.trim().toLowerCase() === newInvoice.vendorName.trim().toLowerCase();
    const amountMatch = inv.amountWithVat && newInvoice.amountWithVat &&
      inv.amountWithVat.trim() === newInvoice.amountWithVat.trim();

    if (numMatch && vendorMatch) return true;
    if (vendorMatch && amountMatch && inv.invoiceDate === newInvoice.invoiceDate) return true;

    return false;
  });
}
