import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  url: { type: String, required: true },
  referrer: { type: String, default: '' },
  sessionId: { type: String, required: true },
  ip: { type: String, default: '' },
  userAgent: { type: String, default: '' },
  country: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

schema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 3600 });
schema.index({ createdAt: -1 });
schema.index({ url: 1 });
schema.index({ sessionId: 1 });

export default mongoose.model('PageView', schema);
