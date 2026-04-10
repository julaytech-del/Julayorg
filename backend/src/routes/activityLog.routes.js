import { Router } from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { getActivityLog } from '../controllers/activityLog.controller.js';

const router = Router();

router.use(protect);

router.get('/', getActivityLog);

export default router;
