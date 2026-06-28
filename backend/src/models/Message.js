import mongoose from 'mongoose';

const attachmentSchema = new mongoose.Schema({
  url:  { type: String, required: true }, // always under /uploads/
  name: { type: String, default: '' },
  type: { type: String, default: '' },    // mime type, e.g. image/png, audio/webm
  size: { type: Number, default: 0 },
}, { _id: false });

// Workspace chat. dmKey = null → shared team channel; otherwise a 1:1 DM keyed
// by the two sorted user ids ("<idA>__<idB>").
const messageSchema = new mongoose.Schema({
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  sender:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text:         { type: String, default: '', trim: true, maxlength: 4000 },
  attachments:  { type: [attachmentSchema], default: [] },
  dmKey:        { type: String, default: null, index: true },
  participants: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], default: [] },
}, { timestamps: true });

messageSchema.index({ organization: 1, dmKey: 1, createdAt: -1 });

export default mongoose.model('Message', messageSchema);
