import mongoose from 'mongoose';

const timeEntrySchema = new mongoose.Schema({
  task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  description: { type: String },
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  duration: { type: Number }, // minutes
  billable: { type: Boolean, default: true }
}, { timestamps: true });

timeEntrySchema.index({ task: 1 });
timeEntrySchema.index({ user: 1, createdAt: -1 });

timeEntrySchema.pre('save', function (next) {
  if (this.endTime && !this.duration) {
    this.duration = Math.round((this.endTime - this.startTime) / 60000);
  }
  next();
});

export default mongoose.model('TimeEntry', timeEntrySchema);
