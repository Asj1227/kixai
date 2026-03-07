import { makeWASocket, useMultiFileAuthState, DisconnectReason, delay } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode';
import { processFileBuffer } from './processor.js';
import { addInvoiceToSession, getUserSession, clearSession } from './sessions.js';
import { applyAiCorrection } from './ai_assistant.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Session storage directory
const AUTH_DIR = path.join(__dirname, '../../whatsapp_auth');
if (!fs.existsSync(AUTH_DIR)) fs.mkdirSync(AUTH_DIR, { recursive: true });

let latestQR = "";
let isConnected = false;

export async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true // Also print in logs just in case
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            // Convert QR to Data URL so we can show it on the website
            qrcode.toDataURL(qr, (err, url) => {
                if (!err) latestQR = url;
            });
        }

        if (connection === 'close') {
            isConnected = false;
            const shouldReconnect = (lastDisconnect.error instanceof Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('[WHATSAPP] Connection closed. Reconnecting:', shouldReconnect);
            if (shouldReconnect) connectToWhatsApp();
        } else if (connection === 'open') {
            isConnected = true;
            latestQR = "";
            console.log('[WHATSAPP] Connection opened successfully! ✅');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    // MESSAGE HANDLER
    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const remoteJid = msg.key.remoteJid;
        const senderId = remoteJid.split('@')[0];
        const session = getUserSession(senderId);

        try {
            // 1. Handle Text Commands
            const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
            if (text) {
                const lowerText = text.trim().toLowerCase();
                
                if (lowerText === 'done') {
                    if (!session.invoices.length) {
                        return await sock.sendMessage(remoteJid, { text: "You haven't uploaded anything yet! Send me a photo first." });
                    }
                    return await sock.sendMessage(remoteJid, { text: `✅ I've processed ${session.invoices.length} invoices in this batch. \n\nType 'clear' to start fresh or tell me to fix something!` });
                }

                if (lowerText === 'clear') {
                    clearSession(senderId);
                    return await sock.sendMessage(remoteJid, { text: "🧹 Session cleared! Send me a new invoice photo whenever you're ready." });
                }

                // AI Correction
                if (text.length > 3 && session.invoices.length > 0) {
                    await sock.sendMessage(remoteJid, { text: "🤖 Analyzing your request..." });
                    const updated = await applyAiCorrection(text, session.invoices);
                    session.invoices = updated;
                    return await sock.sendMessage(remoteJid, { text: "✅ Got it! I've updated the invoices." });
                }
            }

            // 2. Handle Images / PDFs
            const imageMsg = msg.message.imageMessage;
            const documentMsg = msg.message.documentMessage;

            if (imageMsg || documentMsg) {
                await sock.sendMessage(remoteJid, { text: "⏳ Received! Processing your invoice..." });

                // Download Media
                const buffer = await sock.downloadMediaMessage(msg);
                const mimeType = imageMsg ? 'image/jpeg' : documentMsg.mimetype;

                // Process AI
                const result = await processFileBuffer(buffer, mimeType);
                addInvoiceToSession(senderId, result);

                await sock.sendMessage(remoteJid, { text: `✅ Added: ${result.vendorName || "Unknown"} - ${result.amountWithVat || "0.00"}` });
            }

        } catch (err) {
            console.error('[WHATSAPP_BOT_ERROR]', err);
            await sock.sendMessage(remoteJid, { text: "⚠️ Error processing that file. Please try again with a clearer photo." });
        }
    });
}

// Export state for the API
export const getWhatsAppStatus = () => ({
    connected: isConnected,
    qr: latestQR
});
