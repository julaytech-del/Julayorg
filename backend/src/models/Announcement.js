import mongoose from 'mongoose';

const { Schema } = mongoose;

const announcementSchema = new Schema({
  message: { type: String, required: true },
  type: { type: String, enum: ['info', 'warning', 'error', 'success'], default: 'info' },
  active: { type: Boolean, default: true },
  link: { type: String, default: '' },
  linkText: { type: String, default: '' },
  dismissible: { type: Boolean, default: true },
  targetPlans: { type: [String], default: [] },
  expiresAt: { type: Date, default: null },
  createdBy: { type: String },
}, { timestamps: true });

export default mongoose.model('Announcement', announcementSchema);
