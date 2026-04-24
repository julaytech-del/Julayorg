import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  industry: {
    type: String,
    required: true,
    enum: ['technology', 'healthcare', 'finance', 'education', 'construction', 'retail', 'media', 'consulting', 'manufacturing', 'other'],
    default: 'technology'
  },
  description: { type: String, trim: true },
  logo: { type: String },
  integrations: {
    slackWebhookUrl: { type: String },
    slackNotifyOn: {
      taskCreated: { type: Boolean, default: true },
      taskCompleted: { type: Boolean, default: true },
      taskOverdue: { type: Boolean, default: true },
    },
    emailNotifications: { type: Boolean, default: true },
  },
  settings: {
    timezone: { type: String, default: 'UTC' },
    currency: { type: String, default: 'USD' },
    workingDays: { type: [Number], default: [1, 2, 3, 4, 5] },
    workingHours: {
      start: { type: String, default: '09:00' },
      end: { type: String, default: '17:00' }
    }
  },
  subscription: {
    plan: { type: String, enum: ['free', 'starter', 'professional', 'business', 'enterprise'], default: 'free' },
    expiresAt: { type: Date },
    stripeSessionId: { type: String },
    stripeCustomerId: { type: String },
    stripeSubscriptionId: { type: String },
    aiUsedThisMonth: { type: Number, default: 0 },
    billingPeriodStart: { type: Date, default: Date.now }
  }
}, { timestamps: true });

export default mongoose.model('Organization', organizationSchema);
