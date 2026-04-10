import express from 'express';
import { generateReport, getAINarrative, exportExcel } from '../controllers/reports.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();
router.use(protect);
router.post('/generate', generateReport);
router.post('/ai-narrative', getAINarrative);
router.post('/export-excel', exportExcel);
export default router;
