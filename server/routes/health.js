import express from 'express';
import { checkAiHealth } from '../utils/ai.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const userApiKey = req.header('X-API-Key');
    const aiStatus = await checkAiHealth(userApiKey);
    
    // Simulate other service checks for dashboard
    res.json({
      status: 'ok',
      services: {
        ai: aiStatus ? 'ok' : 'degraded',
        ocr: 'ok', 
        whatsapp: 'setup_required'
      }
    });
  } catch (err) {
    res.status(503).json({
      status: 'error',
      services: {
        ai: 'offline',
        ocr: 'unknown',
        whatsapp: 'unknown'
      },
      message: err.message
    });
  }
});

export default router;
