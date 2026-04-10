import express from 'express';
import { getWorkload, aiRebalance } from '../controllers/workload.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();
router.use(protect);
router.get('/', getWorkload);
router.post('/ai-rebalance', aiRebalance);
export default router;
