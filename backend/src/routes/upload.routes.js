import { Router } from 'express';
import multer from 'multer';
import { protect } from '../middleware/auth.middleware.js';
import { upload, uploadFile, deleteFile, getStorageUsage } from '../controllers/upload.controller.js';

const router = Router();
router.use(protect);

router.post('/', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
    }
    if (err) {
      return res.status(500).json({ success: false, message: `Server error: ${err.message}` });
    }
    uploadFile(req, res, next);
  });
});

router.delete('/:filename', deleteFile);
router.get('/usage', getStorageUsage);

export default router;
