import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { upload, uploadFile, deleteFile, getStorageUsage } from '../controllers/upload.controller.js';

const router = Router();
router.use(authenticate);

router.post('/', upload.single('file'), uploadFile);
router.delete('/:filename', deleteFile);
router.get('/usage', getStorageUsage);

export default router;
