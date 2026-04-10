import express from 'express';
import { getCalendarTasks, optimizeDeadline } from '../controllers/calendar.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();
router.use(protect);
router.get('/', getCalendarTasks);
router.post('/optimize-deadline', optimizeDeadline);
export default router;
