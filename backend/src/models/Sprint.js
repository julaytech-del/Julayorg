import mongoose from 'mongoose';

const sprintSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  goal: { type: String },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, enum: ['planning', 'active', 'completed', 'cancelled'], default: 'planning' },
  tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
  velocity: { type: Number },
  capacity: { type: Number },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

sprintSchema.index({ project: 1, status: 1 });
sprintSchema.index({ organization: 1, status: 1 });

export default mongoose.model('Sprint', sprintSchema);
