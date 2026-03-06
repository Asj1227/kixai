// Utility to handle API calls to the KIXAI backend
const API_BASE = '/api';

export async function checkHealth(apiKey = '') {
  try {
    const res = await fetch(`${API_BASE}/health`, {
      headers: { 'X-API-Key': apiKey }
    });
    if (!res.ok) throw new Error('Network error connecting to KIXAI backend');
    return await res.json();
  } catch (err) {
    return {
      status: 'error',
      services: { ai: 'offline', ocr: 'offline', whatsapp: 'unknown' },
      message: err.message
    };
  }
}

export async function extractInvoiceData(file, apiKey = '') {
  const formData = new FormData();
  formData.append('invoiceFile', file);

  const res = await fetch(`${API_BASE}/extract`, {
    method: 'POST',
    headers: { 'X-API-Key': apiKey },
    body: formData,
  });

  const json = await res.json();
  
  if (!res.ok) {
    const errorMsg = json.error || 'Server failed to extract invoice data';
    console.error(`[API Error] ${res.status}: ${errorMsg}`);
    throw new Error(errorMsg);
  }

  return json.data;
}

export async function chatWithAI(currentInvoices, userMessage, chatHistory, apiKey = '', appliedCorrections = []) {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'X-API-Key': apiKey 
    },
    body: JSON.stringify({
      invoices: currentInvoices,
      message: userMessage,
      history: chatHistory,
      appliedCorrections
    }),
  });

  const json = await res.json();
  
  if (!res.ok) {
    throw new Error(json.reply || 'Chat service offline');
  }

  return json;
}
