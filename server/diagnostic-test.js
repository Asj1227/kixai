import path from 'path';
import { extractInvoiceFromBase64 } from './utils/ai.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * STANDALONE DIAGNOSTIC TEST
 * This script verifies if the OpenAI integration is working regardless of the Express server.
 * Run with: node server/diagnostic-test.js
 */

const DUMMY_IMAGE_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="; // 1x1 Blue Pixel
const DUMMY_MIME = "image/png";

async function runDiagnostic() {
  console.log("--- KIXAI AI DIAGNOSTIC START ---");
  console.log("OS:", process.platform);
  console.log("Node Version:", process.version);
  console.log("API Key Exists:", !!process.env.OPENAI_API_KEY);
  
  if (!process.env.OPENAI_API_KEY) {
    console.error("CRITICAL: OPENAI_API_KEY is missing from .env");
    process.exit(1);
  }

  console.log("\nAttempting AI Extraction with Dummy Image...");
  
  try {
    const result = await extractInvoiceFromBase64(DUMMY_IMAGE_BASE64, DUMMY_MIME);
    console.log("\nSUCCESS: AI Responded accurately to dummy image.");
    console.log("Result:", JSON.stringify(result, null, 2));
    console.log("\n--- DIAGNOSTIC STATUS: PASSED ---");
  } catch (err) {
    console.error("\nFAILURE: AI Engine failed during diagnostic.");
    console.error("Error Detail:", err.message);
    console.log("\n--- DIAGNOSTIC STATUS: FAILED ---");
    process.exit(1);
  }
}

runDiagnostic();
