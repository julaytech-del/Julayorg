import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import Organization from '../models/Organization.js';
import { getLimit, isUnlimited } from '../config/planLimits.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, '../../uploads');

const ensureUploadsDir = () => {
  try { fs.mkdirSync(UPLOADS_DIR, { recursive: true }); } catch (e) { /* already exists */ }
};
ensureUploadsDir();

// Use memory storage — avoids all disk-write issues during multer parsing
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

export const uploadFile = async (req, res, next) => {
  try {
    console.log('[upload] user:', req.user?._id, 'file:', req.file?.originalname, 'size:', req.file?.size);

    if (!req.file) return res.status(400).json({ success: false, message: 'No file provided' });

    const orgRef = req.user?.organization;
    const orgId = orgRef?._id ?? orgRef;
    if (!orgId) return res.status(400).json({ success: false, message: 'User has no organization' });

    const org = await Organization.findById(orgId);
    if (!org) return res.status(404).json({ success: false, message: 'Organization not found' });

    const plan = org.subscription?.plan || 'free';

    if (!isUnlimited(plan, 'storage')) {
      const limitGB = getLimit(plan, 'storage');
      const limitBytes = limitGB * 1024 * 1024 * 1024;
      const usedBytes = org.subscription?.storageUsedBytes || 0;
      if (usedBytes + req.file.size > limitBytes) {
        return res.status(403).json({
          success: false,
          code: 'STORAGE_LIMIT_REACHED',
          message: `Storage limit reached (${limitGB} GB). Upgrade your plan to upload more files.`,
        });
      }
    }

    // Write buffer to disk now that we've done all checks
    ensureUploadsDir();
    const ext = path.extname(req.file.originalname) || '.bin';
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    const filePath = path.join(UPLOADS_DIR, filename);
    fs.writeFileSync(filePath, req.file.buffer);

    await Organization.findByIdAndUpdate(orgId, {
      $inc: { 'subscription.storageUsedBytes': req.file.size },
    });

    res.json({
      success: true,
      data: {
        filename,
        originalName: req.file.originalname,
        size: req.file.size,
        url: `/uploads/${filename}`,
        mimeType: req.file.mimetype,
      },
    });
  } catch (err) {
    console.error('[upload] error:', err.message);
    next(err);
  }
};

export const deleteFile = async (req, res, next) => {
  try {
    const { filename } = req.params;
    if (filename.includes('/') || filename.includes('..')) {
      return res.status(400).json({ success: false, message: 'Invalid filename' });
    }
    const filePath = path.join(UPLOADS_DIR, filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    const orgRef = req.user?.organization;
    const orgId = orgRef?._id ?? orgRef;
    if (orgId) {
      const stat = fs.existsSync(filePath) ? fs.statSync(filePath) : null;
      await Organization.findByIdAndUpdate(orgId, {
        $inc: { 'subscription.storageUsedBytes': -(stat?.size || 0) },
      });
    }
    res.json({ success: true, message: 'File deleted' });
  } catch (err) { next(err); }
};

export const getStorageUsage = async (req, res, next) => {
  try {
    const orgRef = req.user?.organization;
    const orgId = orgRef?._id ?? orgRef;
    const org = await Organization.findById(orgId);
    const plan = org?.subscription?.plan || 'free';
    const limitGB = getLimit(plan, 'storage');
    const usedBytes = org?.subscription?.storageUsedBytes || 0;
    const limitBytes = isUnlimited(plan, 'storage') ? null : limitGB * 1024 * 1024 * 1024;
    res.json({
      success: true,
      data: {
        usedBytes,
        usedGB: +(usedBytes / (1024 ** 3)).toFixed(3),
        limitGB: isUnlimited(plan, 'storage') ? null : limitGB,
        limitBytes,
        percentUsed: limitBytes ? +((usedBytes / limitBytes) * 100).toFixed(1) : 0,
        plan,
      },
    });
  } catch (err) { next(err); }
};
