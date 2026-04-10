import express from 'express';
import { getWebhooks, createWebhook, updateWebhook, deleteWebhook, testWebhook, getDeliveryLog } from '../controllers/webhook.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();
router.use(protect);
router.get('/', getWebhooks);
router.post('/', createWebhook);
router.put('/:id', updateWebhook);
router.delete('/:id', deleteWebhook);
router.post('/:id/test', testWebhook);
router.get('/:id/log', getDeliveryLog);
export default router;
