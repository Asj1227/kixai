import express from 'express';
import multer from 'multer';
import { processFileBuffer } from '../utils/processor.js';

const router = express.Router();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

// Helper to add delay for retries
const delay = ms => new Promise(res => setTimeout(res, ms));

router.post('/', upload.single('invoiceFile'), async (req, res) => {
  const startTime = Date.now();
  
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const userApiKey = req.header('X-API-Key');
  const { buffer, mimetype, originalname } = req.file;

  console.log(`[PIPELINE] Incoming request: ${originalname} (${mimetype})`);

  try {
    const result = await processFileBuffer(buffer, mimetype, userApiKey);
    console.log(`[PIPELINE] Success in ${Date.now() - startTime}ms`);
    return res.json({ status: 'success', data: result });
  } catch (err) {
    console.error(`[PIPELINE_ERROR] ${err.message}`);
    return res.status(500).json({ 
      error: err.message,
      details: "Extraction failed during processing."
    });
  }
});

export default router;
