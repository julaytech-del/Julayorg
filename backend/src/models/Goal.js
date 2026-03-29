import mongoose from 'mongoose';

const goalSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  status: { type: String, enum: ['not_started', 'in_progress', 'completed', 'blocked'], default: 'not_started' },
  priority: { type: String, enum: ['critical', 'high', 'medium', 'low'], default: 'medium' },
  dueDate: { type: Date },
  progress: { type: Number, default: 0, min: 0, max: 100 },
  assignees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  order: { type: Number, default: 0 },
  color: { type: String },
  aiGenerated: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Goal', goalSchema);
