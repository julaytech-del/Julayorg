import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userName: { type: String },
  action: {
    type: String,
    required: true,
    enum: ['created', 'updated', 'deleted', 'completed', 'assigned', 'commented', 'status_changed', 'member_added', 'member_removed', 'ai_generated', 'replanned']
  },
  entityType: {
    type: String,
    required: true,
    enum: ['project', 'goal', 'task', 'subtask', 'user', 'department', 'organization']
  },
  entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
  entityName: { type: String },
  changes: { before: mongoose.Schema.Types.Mixed, after: mongoose.Schema.Types.Mixed },
  metadata: { type: mongoose.Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now }
});

activityLogSchema.index({ organization: 1, timestamp: -1 });
activityLogSchema.index({ entityId: 1 });

export default mongoose.model('ActivityLog', activityLogSchema);
