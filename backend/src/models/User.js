import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  avatar: { type: String },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
  jobTitle: { type: String },
  skills: [{
    name: { type: String },
    level: { type: Number, min: 1, max: 5, default: 3 },
    category: { type: String }
  }],
  availability: {
    hoursPerDay: { type: Number, default: 8 },
    timezone: { type: String, default: 'UTC' }
  },
  status: { type: String, enum: ['active', 'inactive', 'busy', 'away'], default: 'active' },
  performance: {
    score: { type: Number, default: 100 },
    tasksCompleted: { type: Number, default: 0 },
    tasksOverdue: { type: Number, default: 0 },
    onTimeRate: { type: Number, default: 100 }
  },
  lastActive: { type: Date, default: Date.now },
  isAdmin: { type: Boolean, default: false }
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export default mongoose.model('User', userSchema);
