import express from 'express';
import axios from 'axios';
import { processFileBuffer } from '../utils/processor.js';
import { addInvoiceToSession, getUserSession, clearSession } from '../utils/sessions.js';
import { applyAiCorrection } from '../utils/ai_assistant.js';

const router = express.Router();

// Get these from process.env on Render
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'kixai_secret_123';
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

// 1. Webhook Verification (for Meta Dashboard setup)
router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('[WHATSAPP_META] Webhook Verified Successfully!');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// 2. Main Webhook Handler
router.post('/webhook', async (req, res) => {
  const body = req.body;

  // Verify it's a WhatsApp message
  if (body.object !== 'whatsapp_business_account') {
    return res.sendStatus(404);
  }

  // Acknowledge receipt immediately to Meta (prevents retries)
  res.status(200).send('EVENT_RECEIVED');

  try {
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];

    if (!message) return;

    const from = message.from; // Phone number
    const session = getUserSession(from);

    // --- HANDLE TEXT MESSAGES ---
    if (message.type === 'text') {
      const text = message.text.body.trim();
      const lowerText = text.toLowerCase();

      if (lowerText === 'done') {
        if (!session.invoices.length) {
          return sendWhatsAppMessage(from, "You haven't uploaded anything yet! Send me a photo first.");
        }
        return sendWhatsAppMessage(from, `✅ I've processed ${session.invoices.length} invoices. \n\nType 'clear' to start fresh or 'fix' to edit.`);
      }

      if (lowerText === 'clear') {
        clearSession(from);
        return sendWhatsAppMessage(from, "🧹 Session cleared! Send me a new invoice photo whenever you're ready.");
      }

      // AI Correction
      if (text.length > 3) {
        await sendWhatsAppMessage(from, "🤖 Analyzing your request...");
        const updated = await applyAiCorrection(text, session.invoices);
        session.invoices = updated;
        return sendWhatsAppMessage(from, "✅ Got it! I've updated the invoices.");
      }
    }

    // --- HANDLE IMAGES / DOCUMENTS ---
    if (message.type === 'image' || message.type === 'document') {
      const media = message.image || message.document;
      const mediaId = media.id;
      const mimeType = media.mime_type;

      await sendWhatsAppMessage(from, "⏳ Received! Processing your invoice...");

      // Get Media URL from Meta
      const mediaUrlResponse = await axios.get(`https://graph.facebook.com/v17.0/${mediaId}`, {
        headers: { Authorization: `Bearer ${ACCESS_TOKEN}` }
      });

      const actualUrl = mediaUrlResponse.data.url;

      // Download Buffer
      const downloadResponse = await axios.get(actualUrl, {
        headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
        responseType: 'arraybuffer'
      });

      const buffer = Buffer.from(downloadResponse.data);

      // AI Extraction
      const result = await processFileBuffer(buffer, mimeType);
      addInvoiceToSession(from, result);

      await sendWhatsAppMessage(from, `✅ Added: ${result.vendorName || "Unknown"} - ${result.amountWithVat || "0.00"}`);
    }

  } catch (err) {
    console.error('[WHATSAPP_META_ERROR]', err);
  }
});

// Helper to send messages back to user via Meta API
async function sendWhatsAppMessage(to, text) {
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  if (!ACCESS_TOKEN || !phoneId) {
    console.warn('[WHATSAPP_META] Missing credentials. Cannot send reply.');
    return;
  }

  try {
    await axios.post(`https://graph.facebook.com/v17.0/${phoneId}/messages`, {
      messaging_product: "whatsapp",
      to: to,
      type: "text",
      text: { body: text }
    }, {
      headers: { Authorization: `Bearer ${ACCESS_TOKEN}` }
    });
  } catch (err) {
    console.error('[WHATSAPP_SEND_ERROR]', err.response?.data || err.message);
  }
}

export default router;
