import express from 'express';
import { getGanttData, saveBaseline, getAIRisks } from '../controllers/gantt.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router({ mergeParams: true });
router.use(protect);
router.get('/', getGanttData);
router.post('/baseline', saveBaseline);
router.post('/ai-risks', getAIRisks);
export default router;
