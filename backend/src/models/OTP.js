import mongoose from 'mongoose';
import crypto from 'crypto';

const otpSchema = new mongoose.Schema({
  email:     { type: String, required: true, lowercase: true, trim: true },
  codeHash:  { type: String, required: true },
  expiresAt: { type: Date, required: true },
  used:      { type: Boolean, default: false },
}, { timestamps: true });

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
otpSchema.index({ email: 1 });

otpSchema.statics.generate = async function (email) {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const codeHash = crypto.createHash('sha256').update(code).digest('hex');
  await this.deleteMany({ email }); // invalidate previous OTPs
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min
  await this.create({ email, codeHash, expiresAt });
  return code;
};

otpSchema.statics.verify = async function (email, code) {
  const codeHash = crypto.createHash('sha256').update(code).digest('hex');
  const otp = await this.findOne({ email, codeHash, used: false });
  if (!otp) return false;
  if (otp.expiresAt < new Date()) return false;
  await this.deleteMany({ email });
  return true;
};

export default mongoose.model('OTP', otpSchema);
