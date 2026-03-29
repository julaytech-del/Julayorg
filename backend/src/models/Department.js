import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  description: { type: String },
  head: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  color: { type: String, default: '#2196F3' },
  icon: { type: String, default: 'work' },
  memberCount: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('Department', departmentSchema);
