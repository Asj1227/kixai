import { extractInvoiceFromBase64 } from './ai.js';
import { pdfToPng } from 'pdf-to-png-converter';

const delay = ms => new Promise(res => setTimeout(res, ms));

export async function processFileBuffer(buffer, mimetype, userApiKey = null) {
  let finalBase64 = "";
  let finalMimeType = mimetype;

  // 1. Convert/Encode
  if (mimetype === 'application/pdf') {
    const pngPages = await pdfToPng(buffer, { 
      pagesToConvertAsImages: [1],
      viewportScale: 2.0 
    });
    
    if (pngPages && pngPages.length > 0) {
      finalBase64 = pngPages[0].content.toString('base64');
      finalMimeType = 'image/png';
    } else {
      throw new Error("PDF_CONVERSION_EMPTY");
    }
  } else {
    finalBase64 = buffer.toString('base64');
  }

  // 2. AI Extraction with Retries
  let attempts = 0;
  const maxAttempts = 2;

  while (attempts < maxAttempts) {
    attempts++;
    try {
      const result = await Promise.race([
        extractInvoiceFromBase64(finalBase64, finalMimeType, userApiKey),
        new Promise((_, rej) => setTimeout(() => rej(new Error("AI_REQUEST_TIMEOUT")), 30000))
      ]);
      return result;
    } catch (err) {
      if (attempts >= maxAttempts) throw err;
      await delay(attempts * 1000);
    }
  }
}
