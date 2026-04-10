import mongoose from 'mongoose';

const automationRuleSchema = new mongoose.Schema({
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  name: { type: String, required: true },
  description: { type: String },
  active: { type: Boolean, default: true },
  trigger: {
    event: { type: String, enum: ['task.status_changed', 'task.created', 'task.assigned', 'task.due_soon', 'project.created', 'task.overdue'], required: true },
    conditions: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  actions: [{
    type: { type: String, enum: ['notify_user', 'change_status', 'assign_user', 'create_subtask', 'add_comment', 'send_webhook'], required: true },
    params: { type: mongoose.Schema.Types.Mixed }
  }],
  lastTriggered: { type: Date },
  runCount: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export default mongoose.model('AutomationRule', automationRuleSchema);
