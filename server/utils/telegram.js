import { Telegraf } from 'telegraf';
import axios from 'axios';
import { processFileBuffer } from '../utils/processor.js';
import { addInvoiceToSession, getUserSession, clearSession } from '../utils/sessions.js';
import { applyAiCorrection } from '../utils/ai_assistant.js';

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.warn("[TELEGRAM] Missing TELEGRAM_BOT_TOKEN. Telegram features will be disabled.");
}

const bot = token ? new Telegraf(token) : null;

if (bot) {
  // 1. Initial Greeting
  bot.start((ctx) => {
    ctx.reply("Welcome to KIXAI Assistant! 📄\n\n- Send me a **photo** or **PDF** of an invoice.\n- Type '**done**' when you want the summary.\n- Type '**clear**' to start fresh.\n- Or tell me to fix something (e.g., 'Delete the first one').");
  });

  // 2. Handle Help
  bot.help((ctx) => ctx.reply("Just send me an invoice file or photo! I'll read it for you."));

  // 3. Handle Photos
  bot.on('photo', async (ctx) => {
    try {
      ctx.reply("⏳ Processing your photo...");
      const photo = ctx.message.photo[ctx.message.photo.length - 1];
      const link = await ctx.telegram.getFileLink(photo.file_id);
      
      const response = await axios.get(link.href, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(response.data);
      
      const result = await processFileBuffer(buffer, 'image/jpeg');
      addInvoiceToSession(ctx.from.id.toString(), result);
      
      ctx.reply(`✅ Added: ${result.vendorName || "Unknown"} - ${result.amountWithVat || "0.00"}`);
    } catch (err) {
      console.error("[TELEGRAM PHOTO ERROR]", err);
      ctx.reply("⚠️ Sorry, I couldn't read that invoice. Try a clearer photo!");
    }
  });

  // 4. Handle Documents (PDFs)
  bot.on('document', async (ctx) => {
    try {
      const mime = ctx.message.document.mime_type;
      if (mime !== 'application/pdf') {
        return ctx.reply("Please send a PDF or a photo!");
      }

      ctx.reply("⏳ Processing your PDF...");
      const link = await ctx.telegram.getFileLink(ctx.message.document.file_id);
      
      const response = await axios.get(link.href, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(response.data);
      
      const result = await processFileBuffer(buffer, 'application/pdf');
      addInvoiceToSession(ctx.from.id.toString(), result);
      
      ctx.reply(`✅ Added: ${result.vendorName || "Unknown"} - ${result.amountWithVat || "0.00"}`);
    } catch (err) {
      console.error("[TELEGRAM PDF ERROR]", err);
      ctx.reply("⚠️ Failed to process PDF.");
    }
  });

  // 5. Handle Text (Commands & Corrections)
  bot.on('text', async (ctx) => {
    const text = ctx.message.text.trim();
    const userId = ctx.from.id.toString();
    const session = getUserSession(userId);

    if (text.toLowerCase() === 'done') {
      if (!session.invoices.length) return ctx.reply("You haven't uploaded anything yet!");
      ctx.reply(`📊 Summary: ${session.invoices.length} invoices processed.\n\nUse the link below to view/edit on the website:\nhttps://kixai.onrender.com`);
      return;
    }

    if (text.toLowerCase() === 'clear') {
      clearSession(userId);
      return ctx.reply("🧹 Ready for a new batch!");
    }

    // AI Correction logic
    if (text.length > 3) {
      if (!session.invoices.length) return ctx.reply("Nothing to fix yet! Send me a photo first.");
      
      ctx.reply("🤖 Analyzing your fix...");
      const updated = await applyAiCorrection(text, session.invoices);
      session.invoices = updated;
      ctx.reply("✅ Got it! I've updated your invoices.");
    }
  });

  // Launch Bot
  bot.launch().then(() => {
    console.log("[TELEGRAM] Bot is online and running.");
  });

  // Enable graceful stop
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

export default bot;
