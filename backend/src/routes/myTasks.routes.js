import { Router } from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { getMyTasks, getMyStats } from '../controllers/myTasks.controller.js';

const router = Router();

router.use(protect);

router.get('/stats', getMyStats);
router.get('/', getMyTasks);

export default router;
