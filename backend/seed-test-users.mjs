import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '.env') });

await mongoose.connect(process.env.MONGODB_URI);
console.log('✅ Connected to MongoDB');

const UserSchema = new mongoose.Schema({
  name: String, email: String, password: String,
  organization: mongoose.Schema.Types.ObjectId,
  role: mongoose.Schema.Types.ObjectId,
  department: mongoose.Schema.Types.ObjectId,
  jobTitle: String, status: String,
}, { strict: false });

const RoleSchema = new mongoose.Schema({ name: String, level: String, organization: mongoose.Schema.Types.ObjectId }, { strict: false });

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Role = mongoose.models.Role || mongoose.model('Role', RoleSchema);

// Find admin user (assi)
const admin = await User.findOne({ email: 'assimohammad489@gmail.com' });
if (!admin) { console.error('❌ Admin user not found'); process.exit(1); }
const orgId = admin.organization;
console.log('🏢 Org ID:', orgId);

// Get all roles for this org
const roles = await Role.find({ organization: orgId }).sort({ level: 1 });
console.log('📋 Roles found:', roles.map(r => `${r.level} (${r.name})`).join(', '));

const PASS = 'Test@12345';
const passwordHash = await bcrypt.hash(PASS, 12);

const USERS = [
  { level: 'manager', name: 'Maya Manager',  email: 'maya.manager@lumyx.test',  jobTitle: 'Project Manager' },
  { level: 'lead',    name: 'Leo Lead',       email: 'leo.lead@lumyx.test',       jobTitle: 'Tech Lead' },
  { level: 'member',  name: 'Mia Member',     email: 'mia.member@lumyx.test',     jobTitle: 'Developer' },
  { level: 'viewer',  name: 'Vera Viewer',    email: 'vera.viewer@lumyx.test',    jobTitle: 'Stakeholder' },
];

for (const u of USERS) {
  const role = roles.find(r => r.level === u.level);
  if (!role) { console.warn(`⚠️  No role found for level: ${u.level}`); continue; }

  const existing = await User.findOne({ email: u.email });
  if (existing) {
    console.log(`⏭  ${u.name} already exists — skipping`);
    continue;
  }

  await User.create({
    name: u.name,
    email: u.email,
    password: passwordHash,
    jobTitle: u.jobTitle,
    organization: orgId,
    role: role._id,
    department: admin.department,
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  console.log(`✅ Created: ${u.name} <${u.email}> [${u.level}]`);
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('SHARED PASSWORD FOR ALL TEST USERS: Test@12345');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

await mongoose.disconnect();
process.exit(0);
