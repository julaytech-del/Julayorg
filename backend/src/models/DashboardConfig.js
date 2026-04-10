import mongoose from 'mongoose';

const widgetSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: { type: String, enum: ['stat_counter', 'bar_chart', 'pie_chart', 'task_list', 'ai_insight', 'activity_feed', 'deadline_list', 'burndown'], required: true },
  config: { type: mongoose.Schema.Types.Mixed, default: {} },
  position: { x: { type: Number, default: 0 }, y: { type: Number, default: 0 }, w: { type: Number, default: 1 }, h: { type: Number, default: 1 } }
}, { _id: false });

const dashboardConfigSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  widgets: [widgetSchema],
}, { timestamps: true });

dashboardConfigSchema.index({ user: 1, organization: 1 }, { unique: true });

export default mongoose.model('DashboardConfig', dashboardConfigSchema);
