import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import Organization from '../models/Organization.js';
import { getLimit, isUnlimited } from '../config/planLimits.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, '../../uploads');

try {
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
} catch (e) {
  console.error('[upload] Could not create uploads dir:', e.message);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

// 50 MB per file hard cap (server-side sanity check)
export const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

export const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file provided' });

    const orgRef = req.user?.organization;
    const orgId = orgRef?._id ?? orgRef;
    if (!orgId) { fs.unlinkSync(req.file.path); return res.status(400).json({ success: false, message: 'User has no organization' }); }

    const org = await Organization.findById(orgId);
    if (!org) { fs.unlinkSync(req.file.path); return res.status(404).json({ success: false, message: 'Organization not found' }); }

    const plan = org.subscription?.plan || 'free';
    const limitGB = getLimit(plan, 'storage');

    if (!isUnlimited(plan, 'storage')) {
      const limitBytes = limitGB * 1024 * 1024 * 1024;
      const usedBytes = org.subscription?.storageUsedBytes || 0;
      if (usedBytes + req.file.size > limitBytes) {
        fs.unlinkSync(req.file.path);
        return res.status(403).json({
          success: false,
          code: 'STORAGE_LIMIT_REACHED',
          message: `Storage limit reached (${limitGB} GB). Upgrade your plan to upload more files.`,
          used: usedBytes,
          limit: limitBytes,
        });
      }
    }

    await Organization.findByIdAndUpdate(orgId, {
      $inc: { 'subscription.storageUsedBytes': req.file.size },
    });

    res.json({
      success: true,
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        url: `/uploads/${req.file.filename}`,
        mimeType: req.file.mimetype,
      },
    });
  } catch (err) {
    if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    next(err);
  }
};

export const deleteFile = async (req, res, next) => {
  try {
    const { filename } = req.params;
    // Prevent path traversal
    if (filename.includes('/') || filename.includes('..')) {
      return res.status(400).json({ success: false, message: 'Invalid filename' });
    }

    const filePath = path.join(UPLOADS_DIR, filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, message: 'File not found' });

    const stat = fs.statSync(filePath);
    fs.unlinkSync(filePath);

    const orgId = req.user.organization._id || req.user.organization;
    await Organization.findByIdAndUpdate(orgId, {
      $inc: { 'subscription.storageUsedBytes': -stat.size },
    });

    res.json({ success: true, message: 'File deleted' });
  } catch (err) { next(err); }
};

export const getStorageUsage = async (req, res, next) => {
  try {
    const orgId = req.user.organization._id || req.user.organization;
    const org = await Organization.findById(orgId);
    const plan = org.subscription?.plan || 'free';
    const limitGB = getLimit(plan, 'storage');
    const usedBytes = org.subscription.storageUsedBytes || 0;
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
