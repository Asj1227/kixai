import { GoogleGenerativeAI } from '@google/generative-ai';

const EXTRACTION_PROMPT = `You are an expert invoice data extraction AI. Analyze this invoice image carefully and extract the following information.

Return ONLY a valid JSON object with these exact fields:
{
  "invoiceDate": "DD/MM/YYYY format, e.g. 15/03/2026. Leave empty string if not found.",
  "invoiceNumber": "Invoice/reference number exactly as shown. Empty string if none.",
  "invoiceDescription": "Short concise description of what was purchased. If multiple items, summarize in one short line. Examples: 'Side Tables', 'Embroidery Logo', 'Catering food', 'Mounting Tape, Card Stand, Card Paper'",
  "vatAmount": "VAT amount formatted as AED followed by the number with 2 decimals, e.g. AED8.08. Empty string if VAT not shown.",
  "amountWithVat": "Final total paid including VAT, formatted as AED followed by number with 2 decimals, e.g. AED161.60. Extract the grand total.",
  "vendorName": "Supplier, store, or company name exactly as shown.",
  "who": "ONLY fill this if the invoice clearly states who paid or who it belongs to. Otherwise empty string.",
  "confidence": "low|medium|high — your confidence in the extraction quality"
}

IMPORTANT RULES:
- Format all currency as AEDxx.xx (e.g. AED56.25, AED1,463.80)
- Format dates as DD/MM/YYYY
- If the invoice is in another currency, convert the format label to AED but keep the original number
- If a field is unclear or missing, use empty string — do NOT guess
- The invoice may be rotated, cropped, handwritten, or low quality — do your best
- Return ONLY the JSON object, no markdown, no explanation`;

const CHAT_SYSTEM_PROMPT = `You are KIXAI, an intelligent invoice management assistant for Khalifa Initiatives. 
You help users manage their invoice data and can modify invoice records based on their requests.

You have access to the current invoice data as JSON. When the user asks you to make changes:
1. Modify the relevant invoice data accordingly
2. Return your response as a JSON object: { "reply": "your friendly response", "updatedData": [...array of all invoices...] }

If the user is just asking a question (no data changes needed), return: { "reply": "your answer", "updatedData": null }

Rules:
- Be friendly, professional, and concise
- "Who?" values should be proper names (e.g. Maryam, Rabaa, Hoor, Shamma)
- Currency format: AEDxx.xx
- Date format: DD/MM/YYYY
- If asked to regenerate Excel, reply that the user should click the Export button
- Always return valid JSON only`;

export async function extractInvoiceData(fileBase64, mimeType, apiKey) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const imagePart = {
    inlineData: { data: fileBase64, mimeType }
  };

  const result = await model.generateContent([EXTRACTION_PROMPT, imagePart]);
  const text = result.response.text();

  // Parse JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON found in Gemini response');

  const parsed = JSON.parse(jsonMatch[0]);
  return parsed;
}

export async function chatWithAI(currentInvoices, userMessage, chatHistory, apiKey) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const contextMessage = `Current invoice data:\n${JSON.stringify(currentInvoices, null, 2)}\n\nUser request: ${userMessage}`;

  const history = chatHistory
    .filter(m => m.role !== 'system')
    .slice(-10) // last 10 messages for context
    .map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));

  const chat = model.startChat({
    history,
    systemInstruction: CHAT_SYSTEM_PROMPT,
  });

  const result = await chat.sendMessage(contextMessage);
  const text = result.response.text();

  // Try to parse JSON response
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        reply: parsed.reply || text,
        updatedData: parsed.updatedData || null
      };
    }
  } catch (_) {
    // fallback: treat as plain text reply
  }

  return { reply: text, updatedData: null };
}
