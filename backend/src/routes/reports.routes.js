import express from 'express';
import { generateReport, getAINarrative, exportExcel } from '../controllers/reports.controller.js';
import { protect, requirePermission } from '../middleware/auth.middleware.js';

const router = express.Router();
router.use(protect);
router.use(requirePermission('reports', 'view'));

router.post('/generate', generateReport);
router.post('/ai-narrative', getAINarrative);
router.post('/export-excel', requirePermission('reports', 'export'), exportExcel);

export default router;
