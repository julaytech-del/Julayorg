import { Router } from 'express';
import { getDashboardStats, getActivityFeed } from '../controllers/dashboard.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();
router.use(protect);

router.get('/', getDashboardStats);
router.get('/activity', getActivityFeed);

export default router;
