import express from 'express';
import { getNotifications, markRead, markAllRead, getCount } from '../controllers/notification.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();
router.use(protect);
router.get('/', getNotifications);
router.get('/count', getCount);
router.patch('/read-all', markAllRead);
router.patch('/:id/read', markRead);
export default router;
