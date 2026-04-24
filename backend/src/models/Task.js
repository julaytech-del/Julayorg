import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  goal: { type: mongoose.Schema.Types.ObjectId, ref: 'Goal' },
  status: { type: String, enum: ['planned', 'in_progress', 'blocked', 'review', 'done'], default: 'planned' },
  priority: { type: String, enum: ['critical', 'high', 'medium', 'low'], default: 'medium' },
  type: {
    type: String,
    enum: ['feature', 'bug', 'research', 'design', 'planning', 'meeting', 'review', 'deployment', 'content', 'testing', 'other'],
    default: 'other'
  },
  assignees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  startDate: { type: Date },
  dueDate: { type: Date },
  estimatedHours: { type: Number, default: 0 },
  actualHours: { type: Number, default: 0 },
  completedAt: { type: Date },
  subtasks: [{
    title: { type: String, required: true },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['pending', 'in_progress', 'done'], default: 'pending' },
    dueDate: { type: Date },
    completedAt: { type: Date }
  }],
  dependencies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
  attachments: [{
    name: String,
    url: String,
    type: String,
    size: Number,
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    uploadedAt: { type: Date, default: Date.now }
  }],
  comments: [{
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date },
    edited: { type: Boolean, default: false }
  }],
  tags: [{ type: String }],
  tools: [{
    name: String,
    category: String,
    url: String,
    description: String
  }],
  labels: [{ type: String }],
  position: { type: Number, default: 0 },
  aiGenerated: { type: Boolean, default: false },
  aiMetadata: {
    reason: String,
    estimationBasis: String,
    skillsRequired: [String],
    toolSuggestions: [String]
  },
  recurring: {
    enabled: { type: Boolean, default: false },
    frequency: { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'weekly' },
    interval: { type: Number, default: 1 },
    endDate: { type: Date },
    lastCreated: { type: Date },
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

taskSchema.index({ project: 1, status: 1 });
taskSchema.index({ assignees: 1, dueDate: 1 });

export default mongoose.model('Task', taskSchema);
