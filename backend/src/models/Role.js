import mongoose from 'mongoose';

const permissionSet = {
  create: { type: Boolean, default: false },
  read: { type: Boolean, default: true },
  update: { type: Boolean, default: false },
  delete: { type: Boolean, default: false }
};

const roleSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  level: { type: String, enum: ['admin', 'manager', 'lead', 'member', 'viewer'], required: true },
  permissions: {
    projects: { ...permissionSet, create: { type: Boolean, default: false } },
    tasks: { ...permissionSet, create: { type: Boolean, default: false }, assign: { type: Boolean, default: false } },
    users: { ...permissionSet },
    departments: { ...permissionSet },
    ai: { use: { type: Boolean, default: false }, configure: { type: Boolean, default: false } },
    reports: { view: { type: Boolean, default: false }, export: { type: Boolean, default: false } }
  },
  isDefault: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Role', roleSchema);
