import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import healthRoute from './routes/health.js';
import extractRoute from './routes/extract.js';
import chatRoute from './routes/chat.js';
import whatsappRoute from './routes/whatsapp.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Startup Checks
console.log("[DEBUG] KIXAI Backend Starting...");
console.log(`[DEBUG] Port: ${PORT}`);
const activeKey = process.env.OPENAI_API_KEY1 || process.env.OPENAI_API_KEY;
console.log(`[DEBUG] API KEY: ${activeKey ? "LOADED (Starts with " + activeKey.substring(0, 7) + "...)" : "MISSING"}`);
if (!activeKey) {
  console.error("[CRITICAL ERROR] Neither OPENAI_API_KEY nor OPENAI_API_KEY1 is defined in .env or environment.");
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true })); // Required for Twilio webhooks

// Serve static files from the React app
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// Routes
app.use('/api/health', healthRoute);
app.use('/api/extract', extractRoute);
app.use('/api/chat', chatRoute);
app.use('/api/whatsapp', whatsappRoute);

// Catch-all for React SPA
app.get('*all', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.message);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 KIXAI Backend running on http://0.0.0.0:${PORT}`);
});
