import { GoogleGenerativeAI } from "@google/generative-ai";

const EXTRACTION_PROMPT = `
Analyze this tax invoice or bill. Extract the following information and return it strictly as a JSON object with this exact structure, with no markdown formatting or other text:
{
  "billName": "Name of the store or company",
  "products": [
    {
      "name": "Product or service name",
      "cost": 10.50
    }
  ],
  "totalCost": 150.00,
  "tax": 10.00
}
If a value is not found, use null or 0 as appropriate. Ensure "cost", "totalCost", and "tax" are numbers. Do not include \`\`\`json\`\`\` or any backticks, just the raw JSON object.
`;

// Helper to convert File to GoogleGenerativeAI Part
async function fileToGenerativePart(file) {
  const base64EncodedDataPromise = new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
}

export async function extractDataFromInvoice(file, apiKey) {
  if (!apiKey) throw new Error("API Key is missing");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  try {
    const imagePart = await fileToGenerativePart(file);
    const result = await model.generateContent([EXTRACTION_PROMPT, imagePart]);
    const responseText = result.response.text().trim();
    
    // Clean up potential markdown formatting from the response
    let cleanJson = responseText;
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.substring(7);
      if (cleanJson.endsWith('```')) {
        cleanJson = cleanJson.substring(0, cleanJson.length - 3);
      }
    } else if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.substring(3);
      if (cleanJson.endsWith('```')) {
        cleanJson = cleanJson.substring(0, cleanJson.length - 3);
      }
    }
    
    return JSON.parse(cleanJson.trim());
  } catch (error) {
    console.error("Error extracting data from invoice:", error);
    throw new Error("Failed to extract data: " + error.message);
  }
}

const EDIT_PROMPT = `
You are an AI assistant helping a user edit a JSON object containing tax invoice data.
The current JSON state is provided below.
The user will give you a request to modify this data.
You must return the updated JSON strict format with no markdown formatting.
Return ONLY the final JSON object. Do not include \`\`\`json\`\`\` or any backticks.

CURRENT JSON:
`;

export async function editExtractedData(currentData, userRequest, apiKey) {
  if (!apiKey) throw new Error("API Key is missing");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  try {
    const prompt = `${EDIT_PROMPT}\n${JSON.stringify(currentData, null, 2)}\n\nUSER REQUEST:\n${userRequest}`;
    
    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();
    
    let cleanJson = responseText;
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.substring(7);
      if (cleanJson.endsWith('```')) {
        cleanJson = cleanJson.substring(0, cleanJson.length - 3);
      }
    } else if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.substring(3);
      if (cleanJson.endsWith('```')) {
        cleanJson = cleanJson.substring(0, cleanJson.length - 3);
      }
    }
    
    return JSON.parse(cleanJson.trim());
  } catch (error) {
    console.error("Error editing data:", error);
    throw new Error("Failed to edit data: " + error.message);
  }
}
