import { Router } from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { upload, uploadFile, deleteFile, getStorageUsage } from '../controllers/upload.controller.js';

const router = Router();
router.use(protect);

router.post('/', upload.single('file'), uploadFile);
router.delete('/:filename', deleteFile);
router.get('/usage', getStorageUsage);

export default router;
