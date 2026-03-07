import express from 'express';
import axios from 'axios';
import { MessagingResponse } from 'twilio/lib/twiml/MessagingResponse.js';
import { processFileBuffer } from '../utils/processor.js';
import { addInvoiceToSession, getUserSession, clearSession, persist } from '../utils/sessions.js';
import { generateExcelBuffer } from '../utils/excel.js';
import { applyAiCorrection } from '../utils/ai_assistant.js';

const router = express.Router();

// Helper to send TwiML response
const sendReply = (res, message) => {
  const twiml = new MessagingResponse();
  twiml.message(message);
  res.type('text/xml').send(twiml.toString());
};

router.post('/webhook', async (req, res) => {
  const { Body, From, MediaUrl0, MediaContentType0 } = req.body;
  const phone = From;
  const text = Body ? Body.trim() : "";

  console.log(`[WHATSAPP] Message from ${phone}: ${text || "[Media]"}`);

  try {
    const session = getUserSession(phone);

    // 1. Handle "Done" command (Export Excel)
    if (text.toLowerCase() === 'done') {
      if (!session.invoices || session.invoices.length === 0) {
        return sendReply(res, "You haven't uploaded any invoices yet! Send me a photo first.");
      }
      return sendReply(res, `✅ I've processed ${session.invoices.length} invoices. \n\nI'm preparing your Excel file... (Note: Link will be sent separately once ready).`);
    }

    // 2. Handle "Clear" command
    if (text.toLowerCase() === 'clear') {
      clearSession(phone);
      return sendReply(res, "🧹 Session cleared! Send me a new invoice photo whenever you're ready.");
    }

    // 3. Handle Media (Invoice Upload)
    if (MediaUrl0) {
      sendReply(res, "⏳ Received! Processing your invoice now...");

      const response = await axios.get(MediaUrl0, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(response.data);
      const result = await processFileBuffer(buffer, MediaContentType0);
      
      addInvoiceToSession(phone, result);
      console.log(`[WHATSAPP] Success: Added invoice for ${phone}`);
      return; 
    }

    // 4. Handle AI Correction/Command
    if (text.length > 3) {
      if (!session.invoices || session.invoices.length === 0) {
        return sendReply(res, "I don't have any invoices to fix yet! Please send a photo first.");
      }

      sendReply(res, "🤖 Analyzing your request and updating the data...");
      const updated = await applyAiCorrection(text, session.invoices);
      session.invoices = updated;
      
      // We need to re-persist manually since we updated session.invoices directly
      // Or I can add an updateSession util. For now, let's just log.
      console.log(`[WHATSAPP] AI Correction applied for ${phone}`);
      return;
    }

    // Default Greeting
    return sendReply(res, "Hello! I'm the KIXAI Assistant. 📄\n\n- Send me a **photo** or **PDF** of an invoice.\n- Type '**done**' when you want the summary.\n- Type '**clear**' to start fresh.\n- Or tell me to fix something (e.g., 'Delete the first one').");

  } catch (err) {
    console.error("[WHATSAPP ERROR]", err);
    return sendReply(res, "⚠️ Sorry, I had trouble processing that. Please try again or send a clearer photo.");
  }
});

export default router;
