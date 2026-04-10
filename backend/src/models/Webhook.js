import mongoose from 'mongoose';

const webhookSchema = new mongoose.Schema({
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  name: { type: String, required: true },
  url: { type: String, required: true },
  secret: { type: String },
  events: [{ type: String, enum: ['task.created', 'task.updated', 'task.deleted', 'task.status_changed', 'project.created', 'project.updated', 'comment.added', 'member.assigned'] }],
  active: { type: Boolean, default: true },
  lastTriggeredAt: { type: Date },
  deliveryLog: [{
    triggeredAt: { type: Date, default: Date.now },
    event: String,
    statusCode: Number,
    response: String,
    success: Boolean,
    durationMs: Number
  }],
}, { timestamps: true });

export default mongoose.model('Webhook', webhookSchema);
