import mongoose from 'mongoose';

const suggestionSchema = new mongoose.Schema({
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  source: {
    type: { type: String, enum: ['manual', 'slack', 'gmail', 'whatsapp', 'pdf', 'notion', 'github'], default: 'manual' },
    label: { type: String, default: 'Manual Share' },
    icon: { type: String, default: '📋' }
  },
  sharedText: { type: String, required: true },
  aiAnalysis: { type: String },
  items: [{
    type: { type: String, enum: ['add_task', 'update_task', 'add_goal', 'update_timeline', 'add_blocker', 'add_note', 'reassign'], required: true },
    title: { type: String, required: true },
    description: { type: String },
    data: { type: mongoose.Schema.Types.Mixed },
    status: { type: String, enum: ['pending', 'applied', 'rejected'], default: 'pending' }
  }],
  status: { type: String, enum: ['pending', 'partially_applied', 'applied', 'rejected'], default: 'pending' }
}, { timestamps: true });

export default mongoose.model('Suggestion', suggestionSchema);
