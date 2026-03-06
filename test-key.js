import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

async function testKey() {
  const key = process.env.GEMINI_API_KEY;
  console.log('Testing Key:', key ? key.substring(0, 10) + '...' : 'UNDEFINED');
  
  if (!key) {
    console.log('NO KEY FOUND IN .ENV');
    return;
  }

  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const res = await model.generateContent("Say 'KEY WORKS'");
    console.log('RESPONSE:', res.response.text());
  } catch (err) {
    console.error('API REJECTED KEY. ERROR:', err.message);
  }
}

testKey();
