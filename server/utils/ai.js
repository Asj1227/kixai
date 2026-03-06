import OpenAI from 'openai';

// ── Extraction Prompt ───────────────────────
const EXTRACTION_PROMPT = `You are KIXAI, an expert invoice data extraction AI for Khalifa Initiatives. Analyze this invoice image carefully and extract the following information.

Return ONLY a valid JSON object with these exact fields:
{
  "invoiceDate": "DD/MM/YYYY format, e.g. 15/03/2026. Empty string if none.",
  "invoiceNumber": "Invoice/reference number exactly as shown. Empty string if none.",
  "invoiceDescription": "Short concise description of what was purchased. If multiple items, summarize in one short line. Examples: 'Side Tables', 'Embroidery Logo', 'Catering food', 'Mounting Tape, Card Stand, Card Paper'",
  "vatAmount": "VAT amount formatted as AED followed by the number with 2 decimals, e.g. AED8.08. Empty string if VAT not shown.",
  "amountWithVat": "Final grand total paid including VAT, formatted as AED followed by number with 2 decimals, e.g. AED161.60. Extract the grand total.",
  "vendorName": "Supplier, store, or company name exactly as shown.",
  "who": "ONLY fill this if the invoice clearly states who paid or who it belongs to. Otherwise empty string.",
  "originalCurrency": "The currency shown in the invoice (e.g. AED, USD, EUR)",
  "confidenceScores": {
    "invoiceDate": "high|medium|low",
    "invoiceNumber": "high|medium|low",
    "amountWithVat": "high|medium|low",
    "vendorName": "high|medium|low"
  }
}

IMPORTANT RULES:
- Format all currency as AEDxx.xx (e.g. AED56.25, AED1,463.80). 
- If the invoice is in another currency, convert the format label to AED but keep the original number, and note the originalCurrency.
- Format dates as DD/MM/YYYY
- If a field is unclear, missing, or you are unsure, use an empty string — do NOT guess aggressively.
- The invoice may be rotated, cropped, handwritten, or low quality — do your best.
- Mark confidence as "low" if the image is blurry, handwriting is messy, or the value is ambiguous.
- Return ONLY the JSON object, absolutely no markdown formatting, no \`\`\`json wrappers, no explanation.`;

const CHAT_SYSTEM_PROMPT = `You are KIXAI, an intelligent invoice management assistant for Khalifa Initiatives. 
You help users manage their invoice data, provide summaries, and can modify invoice records based on their requests.

You have access to the attached invoice batch data as JSON. When the user asks you to make changes:
1. Modify the relevant invoice data accordingly
2. Return your response as a JSON object: { "reply": "your friendly response", "updatedData": [...array of all invoices...] }

If the user is asking an analytical question (totals, missing data, summaries), calculate the answer based on the JSON and return: { "reply": "your answer", "updatedData": null }

Rules:
- Be friendly, professional, and concise. KIXAI is a premium assistant.
- "Who?" values should be proper names (e.g. Maryam, Rabaa, Hoor, Shamma)
- Currency format: AEDxx.xx
- Date format: DD/MM/YYYY
- If asked to regenerate Excel, reply that the user should click the Export Excel button in the UI.
- Always return valid JSON only, without \`\`\`json wrappers.`;

const DEFAULT_MODEL = "gpt-4o-mini"; 

function getOpenAI(userApiKey) {
  const key = userApiKey || process.env.OPENAI_API_KEY1 || process.env.OPENAI_API_KEY;
  if (!key) throw new Error("AUTH_ERROR: OPENAI_API_KEY (or OPENAI_API_KEY1) is not configured on the server, and no valid key was provided in headers.");
  return new OpenAI({ apiKey: key });
}

/**
 * Classifies OpenAI errors into user-friendly categories
 */
function classifyError(err) {
  const msg = err.message || "";
  if (msg.includes("429") || msg.includes("quota")) return `QUOTA_EXCEEDED: ${msg}`;
  if (msg.includes("401") || msg.includes("API key")) return `AUTH_ERROR: ${msg}`;
  if (msg.includes("model_not_found") || msg.includes("404")) return `MODEL_ERROR: ${msg}`;
  if (msg.includes("timeout") || msg.includes("TIMEOUT")) return `NETWORK_TIMEOUT: Request took too long.`;
  return `AI_ERROR: ${msg}`;
}

export async function checkAiHealth(userApiKey) {
  console.log("[PIPELINE_DEBUG] AI Health Check Initiated.");
  try {
    const openai = getOpenAI(userApiKey);
    const model = DEFAULT_MODEL;
    
    await openai.chat.completions.create({
      model: model,
      messages: [{ role: "user", content: "hi" }],
      max_tokens: 1
    });
    
    console.log("[PIPELINE_DEBUG] AI Health Check: SUCCESS");
    return true;
  } catch (err) {
    const error = classifyError(err);
    console.error("[PIPELINE_DEBUG] AI Health Check: FAILED -", error);
    return false;
  }
}

export async function extractInvoiceFromBase64(fileBase64, mimeType, userApiKey) {
  console.log(`[PIPELINE_DEBUG] AI STEP: Sending payload to OpenAI (Type: ${mimeType}, Size: ${fileBase64.length} chars)`);
  const openai = getOpenAI(userApiKey);
  const model = DEFAULT_MODEL;
  
  try {
    const response = await openai.chat.completions.create({
      model: model,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: EXTRACTION_PROMPT },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${fileBase64}`,
              },
            },
          ],
        },
      ],
    });

    const text = response.choices[0].message.content;
    console.log(`[PIPELINE_DEBUG] AI RAW RESPONSE (First 200chars): ${text.substring(0, 200)}...`);

    try {
      const parsed = JSON.parse(text);
      console.log("[PIPELINE_DEBUG] AI JSON PARSE: SUCCESS");
      return parsed;
    } catch (parseErr) {
      console.error("[PIPELINE_DEBUG] AI JSON PARSE: FAILED. Content was not valid JSON.");
      throw new Error(`JSON_PARSE_ERROR: Response was "${text.substring(0, 50)}..."`);
    }
  } catch (err) {
    const error = classifyError(err);
    console.error("[PIPELINE_DEBUG] AI REQUEST FAILED:", error);
    throw new Error(error);
  }
}

export async function chatWithAI(currentInvoices, userMessage, chatHistory, userApiKey) {
  console.log("[PIPELINE_DEBUG] AI Chat Request Start.");
  const openai = getOpenAI(userApiKey);
  const model = DEFAULT_MODEL;

  try {
    const contextMessage = `Current invoice data batch:\n${JSON.stringify(currentInvoices, null, 2)}\n\nUser request: ${userMessage}`;

    const history = chatHistory
      .filter(m => m.role !== 'system')
      .slice(-10)
      .map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content
      }));

    const messages = [
      { role: "system", content: CHAT_SYSTEM_PROMPT },
      ...history,
      { role: "user", content: contextMessage }
    ];

    const response = await openai.chat.completions.create({
      model: model,
      response_format: { type: "json_object" },
      messages: messages,
    });

    const text = response.choices[0].message.content;

    const parsed = JSON.parse(text);
    return {
      reply: parsed.reply || text,
      updatedData: parsed.updatedData || null
    };
  } catch (err) {
    const error = classifyError(err);
    console.error("[PIPELINE_DEBUG] Chat AI FAILED:", error);
    throw new Error(error);
  }
}
