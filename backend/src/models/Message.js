import mongoose from 'mongoose';

// Workspace team chat — one shared channel per organization (MVP).
const messageSchema = new mongoose.Schema({
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  sender:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text:         { type: String, required: true, trim: true, maxlength: 4000 },
}, { timestamps: true });

messageSchema.index({ organization: 1, createdAt: -1 });

export default mongoose.model('Message', messageSchema);
