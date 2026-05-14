import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true },
  token: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
  used: { type: Boolean, default: false },
}, { timestamps: true });

schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('PasswordReset', schema);
