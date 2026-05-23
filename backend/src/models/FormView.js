import mongoose from 'mongoose';
import crypto from 'crypto';

const fieldSchema = new mongoose.Schema({
  id: { type: String, required: true },
  label: { type: String, required: true },
  type: { type: String, enum: ['text', 'textarea', 'number', 'date', 'select', 'user', 'priority', 'phone', 'url', 'rating'], required: true },
  required: { type: Boolean, default: false },
  options: [String],
  placeholder: String,
  mapTo: { type: String, default: 'title' }
}, { _id: false });

const formViewSchema = new mongoose.Schema({
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  name: { type: String, required: true },
  description: { type: String },
  fields: [fieldSchema],
  publicToken: { type: String, unique: true },
  active: { type: Boolean, default: true },
  mode: { type: String, enum: ['task', 'survey'], default: 'task' },
  submissions: [{
    data: mongoose.Schema.Types.Mixed,
    submittedAt: { type: Date, default: Date.now },
    createdTaskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
    status: { type: String, enum: ['pending', 'converted', 'backlog', 'ignored'], default: 'pending' }
  }],
  successMessage: { type: String, default: 'Thank you! Your submission has been received.' },
  redirectUrl: { type: String },
  notifyEmail: { type: String },
  submissionCount: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

formViewSchema.pre('save', function (next) {
  if (!this.publicToken) this.publicToken = crypto.randomBytes(16).toString('hex');
  next();
});

export default mongoose.model('FormView', formViewSchema);
