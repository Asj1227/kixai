import express from 'express';
import { chatWithAI } from '../utils/ai.js';
import { learnFromCorrections } from '../utils/memory.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { invoices, message, history, appliedCorrections } = req.body;
    
    const userApiKey = req.header('X-API-Key');
    
    // Check if the user passed explicit corrections to learn from before chatting
    if (appliedCorrections && appliedCorrections.length > 0) {
      learnFromCorrections(appliedCorrections);
    }

    const { reply, updatedData } = await chatWithAI(invoices, message, history, userApiKey);
    
    res.json({ reply, updatedData });
  } catch (err) {
    console.error('[Chat Error]', err.message);
    res.status(500).json({ reply: `Sorry, I hit an error: ${err.message}`, updatedData: null });
  }
});

export default router;
