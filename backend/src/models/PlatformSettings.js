import mongoose from 'mongoose';

const { Schema } = mongoose;

const platformSettingsSchema = new Schema({
  _id: { type: String, default: 'singleton' },

  maintenanceMode: { type: Boolean, default: false },
  maintenanceMessage: { type: String, default: 'We are performing maintenance. Please check back soon.' },

  allowNewSignups: { type: Boolean, default: true },
  allowGoogleAuth: { type: Boolean, default: true },

  plans: {
    type: Map,
    of: new Schema({
      price: { type: Number, default: 0 },
      maxMembers: { type: Number, default: 5 },
      maxProjects: { type: Number, default: 3 },
      maxStorage: { type: Number, default: 1 },
      aiCredits: { type: Number, default: 0 },
      automations: { type: Boolean, default: false },
      reports: { type: Boolean, default: false },
      webhooks: { type: Boolean, default: false },
      customRoles: { type: Boolean, default: false },
      portfolios: { type: Boolean, default: false },
    }, { _id: false }),
    default: {
      free:         { price: 0,   maxMembers: 5,   maxProjects: 3,   maxStorage: 1,   aiCredits: 0,    automations: false, reports: false, webhooks: false, customRoles: false, portfolios: false },
      starter:      { price: 19,  maxMembers: 10,  maxProjects: 10,  maxStorage: 5,   aiCredits: 100,  automations: true,  reports: false, webhooks: false, customRoles: false, portfolios: false },
      professional: { price: 59,  maxMembers: 25,  maxProjects: 50,  maxStorage: 20,  aiCredits: 500,  automations: true,  reports: true,  webhooks: true,  customRoles: true,  portfolios: false },
      business:     { price: 99,  maxMembers: 100, maxProjects: 200, maxStorage: 100, aiCredits: 2000, automations: true,  reports: true,  webhooks: true,  customRoles: true,  portfolios: true  },
      enterprise:   { price: 299, maxMembers: -1,  maxProjects: -1,  maxStorage: -1,  aiCredits: -1,   automations: true,  reports: true,  webhooks: true,  customRoles: true,  portfolios: true  },
    },
  },

  featureFlags: {
    aiEnabled:          { type: Boolean, default: true },
    automationsEnabled: { type: Boolean, default: true },
    reportsEnabled:     { type: Boolean, default: true },
    portfoliosEnabled:  { type: Boolean, default: true },
    webhooksEnabled:    { type: Boolean, default: true },
    ganttEnabled:       { type: Boolean, default: true },
    sprintsEnabled:     { type: Boolean, default: true },
    timeTrackingEnabled:{ type: Boolean, default: true },
    calendarEnabled:    { type: Boolean, default: true },
  },

  contactEmail: { type: String, default: 'support@julay.org' },
  supportUrl:   { type: String, default: '' },
  termsUrl:     { type: String, default: '' },
  privacyUrl:   { type: String, default: '' },

  updatedAt: { type: Date, default: Date.now },
}, { _id: false });

const PlatformSettings = mongoose.model('PlatformSettings', platformSettingsSchema);

export async function getSettings() {
  let doc = await PlatformSettings.findById('singleton');
  if (!doc) {
    doc = await PlatformSettings.create({ _id: 'singleton' });
  }
  return doc;
}

export default PlatformSettings;
