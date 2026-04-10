import mongoose from 'mongoose';
import crypto from 'crypto';

const fieldSchema = new mongoose.Schema({
  id: { type: String, required: true },
  label: { type: String, required: true },
  type: { type: String, enum: ['text', 'textarea', 'number', 'date', 'select', 'user', 'priority'], required: true },
  required: { type: Boolean, default: false },
  options: [String],
  placeholder: String,
  mapTo: { type: String, enum: ['title', 'description', 'priority', 'dueDate', 'estimatedHours', 'notes'], default: 'title' }
}, { _id: false });

const formViewSchema = new mongoose.Schema({
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  name: { type: String, required: true },
  description: { type: String },
  fields: [fieldSchema],
  publicToken: { type: String, unique: true },
  active: { type: Boolean, default: true },
  submissions: [{
    data: mongoose.Schema.Types.Mixed,
    submittedAt: { type: Date, default: Date.now },
    createdTaskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' }
  }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

formViewSchema.pre('save', function (next) {
  if (!this.publicToken) this.publicToken = crypto.randomBytes(16).toString('hex');
  next();
});

export default mongoose.model('FormView', formViewSchema);
