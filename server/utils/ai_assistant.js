import { getOpenAI } from './ai.js';

/**
 * Takes user text (e.g., "delete bill 1", "change the total of the first one to 500")
 * and the current invoice list, then returns the updated list.
 */
export async function applyAiCorrection(userText, currentInvoices) {
  const openai = getOpenAI();

  const prompt = `
    You are the KIXAI Assistant. The user wants to modify their current list of scanned invoices.
    
    CURRENT INVOICES (JSON):
    ${JSON.stringify(currentInvoices.map((inv, i) => ({ id: i + 1, ...inv })), null, 2)}

    USER REQUEST: "${userText}"

    INSTRUCTIONS:
    1. If the user wants to DELETE an invoice (e.g., "remove the last one", "delete #2"), return the updated list without that item.
    2. If the user wants to FIX a value (e.g., "the total for the first bill is 50", "change vendor of #2 to Apple"), update that specific field.
    3. Return ONLY the valid JSON array of invoices. Do not include any explanation.
    4. If the request is unclear, return the original list.

    OUTPUT FORMAT:
    [ { "vendorName": "...", "totalAmount": ..., ... }, ... ]
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a precise data editor. Return only raw JSON arrays." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    const parsed = JSON.parse(response.choices[0].message.content);
    // Handle both { "invoices": [...] } and direct arrays if the model varies
    return Array.isArray(parsed) ? parsed : (parsed.invoices || currentInvoices);
  } catch (err) {
    console.error("[AI_CORRECTION_ERROR]", err);
    return currentInvoices;
  }
}
