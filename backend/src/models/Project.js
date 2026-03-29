import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  industry: { type: String },
  status: { type: String, enum: ['planning', 'active', 'on_hold', 'completed', 'cancelled'], default: 'planning' },
  priority: { type: String, enum: ['critical', 'high', 'medium', 'low'], default: 'medium' },
  startDate: { type: Date },
  endDate: { type: Date },
  actualEndDate: { type: Date },
  team: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['owner', 'manager', 'member'], default: 'member' }
  }],
  departments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Department' }],
  tags: [{ type: String }],
  progress: {
    percentage: { type: Number, default: 0 },
    completedTasks: { type: Number, default: 0 },
    totalTasks: { type: Number, default: 0 }
  },
  aiGenerated: { type: Boolean, default: false },
  aiMetadata: {
    originalPrompt: { type: String },
    generatedAt: { type: Date },
    confidence: { type: Number },
    detectedIndustry: { type: String }
  },
  settings: {
    allowGuestAccess: { type: Boolean, default: false },
    notificationsEnabled: { type: Boolean, default: true }
  },
  color: { type: String, default: '#6366F1' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export default mongoose.model('Project', projectSchema);
