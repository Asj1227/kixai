import express from 'express';
import multer from 'multer';
import { extractInvoiceFromBase64 } from '../utils/ai.js';
import { pdfToPng } from 'pdf-to-png-converter';

const router = express.Router();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

// Helper to add delay for retries
const delay = ms => new Promise(res => setTimeout(res, ms));

router.post('/', upload.single('invoiceFile'), async (req, res) => {
  const startTime = Date.now();
  console.log(`\n[PIPELINE_DEBUG] >>> NEW REQUEST RECEIVED [${new Date().toISOString()}]`);
  
  if (!req.file) {
    console.error("[PIPELINE_DEBUG] STEP 1 FAILED: No file found in request.");
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const userApiKey = req.header('X-API-Key');
  const { buffer, mimetype, originalname, size } = req.file;

  console.log(`[PIPELINE_DEBUG] STEP 1: Multer Receipt OK`);
  console.log(`[PIPELINE_DEBUG]   - Filename: ${originalname}`);
  console.log(`[PIPELINE_DEBUG]   - MimeType: ${mimetype}`);
  console.log(`[PIPELINE_DEBUG]   - Size: ${size} bytes`);
  console.log(`[PIPELINE_DEBUG]   - Buffer Length Match: ${buffer.length === size ? "YES" : "NO (" + buffer.length + ")"}`);

  let finalBase64 = "";
  let finalMimeType = mimetype;

  try {
    if (mimetype === 'application/pdf') {
      console.log("[PIPELINE_DEBUG] STEP 2: PDF Detected. Starting Conversion...");
      const convStart = Date.now();
      const pngPages = await pdfToPng(buffer, { 
        pagesToConvertAsImages: [1],
        viewportScale: 2.0 
      });
      const convEnd = Date.now();
      
      if (pngPages && pngPages.length > 0) {
        finalBase64 = pngPages[0].content.toString('base64');
        finalMimeType = 'image/png';
        console.log(`[PIPELINE_DEBUG] STEP 2 OK: PDF Converted in ${convEnd - convStart}ms`);
        console.log(`[PIPELINE_DEBUG]   - Resulting Image Base64 Length: ${finalBase64.length}`);
      } else {
        throw new Error("PDF_CONVERSION_EMPTY: Library returned 0 pages.");
      }
    } else {
      console.log("[PIPELINE_DEBUG] STEP 2: Image Detected. Encoding Buffer...");
      finalBase64 = buffer.toString('base64');
      console.log(`[PIPELINE_DEBUG] STEP 2 OK: Image Encoded. Length: ${finalBase64.length}`);
    }
  } catch (err) {
    console.error(`[PIPELINE_DEBUG] STEP 2 FAILED (Conversion/Encoding): ${err.message}`);
    return res.status(500).json({ error: `PIPELINE_STEP_2_FAILED: ${err.message}` });
  }

  let attempts = 0;
  const maxAttempts = 2;

  while (attempts < maxAttempts) {
    attempts++;
    console.log(`[PIPELINE_DEBUG] STEP 3: AI Extraction Attempt ${attempts}...`);
    try {
      // Add a 30s timeout safety to the AI call
      const aiStart = Date.now();
      const result = await Promise.race([
        extractInvoiceFromBase64(finalBase64, finalMimeType, userApiKey),
        new Promise((_, rej) => setTimeout(() => rej(new Error("AI_REQUEST_TIMEOUT")), 30000))
      ]);
      const aiEnd = Date.now();

      console.log(`[PIPELINE_DEBUG] STEP 3 OK: AI Responded in ${aiEnd - aiStart}ms`);
      console.log(`[PIPELINE_DEBUG] >>> TOTAL PIPELINE SUCCESS in ${Date.now() - startTime}ms\n`);
      return res.json({ status: 'success', data: result });
    } catch (err) {
      console.warn(`[PIPELINE_DEBUG] STEP 3 FAILED (Attempt ${attempts}): ${err.message}`);
      
      if (attempts >= maxAttempts) {
        console.error(`[PIPELINE_DEBUG] >>> PIPELINE CRITICAL FAILURE after ${attempts} attempts.\n`);
        return res.status(500).json({ 
          error: err.message, 
          details: `Extraction failed at Step 3 (AI) after ${attempts} attempts.`
        });
      }
      
      const wait = attempts * 1000;
      await delay(wait);
    }
  }
});

export default router;
