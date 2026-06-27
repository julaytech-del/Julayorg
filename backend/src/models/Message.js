import mongoose from 'mongoose';

const attachmentSchema = new mongoose.Schema({
  url:  { type: String, required: true }, // always under /uploads/
  name: { type: String, default: '' },
  type: { type: String, default: '' },    // mime type, e.g. image/png, audio/webm
  size: { type: Number, default: 0 },
}, { _id: false });

// Workspace team chat — one shared channel per organization (MVP).
const messageSchema = new mongoose.Schema({
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  sender:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text:         { type: String, default: '', trim: true, maxlength: 4000 },
  attachments:  { type: [attachmentSchema], default: [] },
}, { timestamps: true });

messageSchema.index({ organization: 1, createdAt: -1 });

export default mongoose.model('Message', messageSchema);
