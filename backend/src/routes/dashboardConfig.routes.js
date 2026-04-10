import express from 'express';
import { getConfig, updateConfig, getAIInsight } from '../controllers/dashboardConfig.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();
router.use(protect);
router.get('/config', getConfig);
router.put('/config', updateConfig);
router.get('/ai-insight', getAIInsight);
export default router;
