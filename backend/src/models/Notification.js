import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  type: { type: String, enum: ['task_assigned', 'task_due_soon', 'task_overdue', 'comment_added', 'status_changed', 'automation_triggered', 'project_created', 'member_joined'], required: true },
  title: { type: String, required: true },
  body: { type: String },
  link: { type: String },
  read: { type: Boolean, default: false },
  readAt: { type: Date },
  entityId: { type: mongoose.Schema.Types.ObjectId },
  entityType: { type: String, enum: ['task', 'project', 'comment', 'user'] },
  metadata: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);
