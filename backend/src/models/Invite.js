import mongoose from 'mongoose';

const inviteSchema = new mongoose.Schema({
  email:        { type: String, required: true, lowercase: true, trim: true },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  token:        { type: String, required: true, unique: true },
  expiresAt:    { type: Date, required: true },
  used:         { type: Boolean, default: false },
  usedAt:       { type: Date },
}, { timestamps: true });

inviteSchema.index({ token: 1 });
inviteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('Invite', inviteSchema);
