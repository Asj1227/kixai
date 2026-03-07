import fs from 'fs';
import path from 'path';

const SESSIONS_FILE = path.resolve('server/whatsapp_sessions.json');

// Memory-based cache with file fallback
let sessions = {};

if (fs.existsSync(SESSIONS_FILE)) {
  try {
    sessions = JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf8'));
  } catch (e) {
    sessions = {};
  }
}

function persist() {
  fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2));
}

export function getUserSession(phone) {
  if (!sessions[phone]) {
    sessions[phone] = { invoices: [], lastActivity: Date.now() };
    persist();
  }
  return sessions[phone];
}

export function addInvoiceToSession(phone, invoiceData) {
  const session = getUserSession(phone);
  session.invoices.push({
    ...invoiceData,
    timestamp: new Date().toISOString()
  });
  session.lastActivity = Date.now();
  persist();
}

export function clearSession(phone) {
  delete sessions[phone];
  persist();
}

export function updateInvoiceInSession(phone, index, patches) {
  const session = getUserSession(phone);
  if (session.invoices[index]) {
    session.invoices[index] = { ...session.invoices[index], ...patches };
    persist();
    return true;
  }
  return false;
}
