/**
 * Presentation Seed Script — Lumyx Digital
 * Clears all test data and inserts realistic demo data
 */
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '.env') });

await mongoose.connect(process.env.MONGODB_URI);
console.log('✅ Connected');

// ── Raw collections ────────────────────────────────────────────────────────
const db        = mongoose.connection.db;
const Users     = db.collection('users');
const Projects  = db.collection('projects');
const Tasks     = db.collection('tasks');
const Depts     = db.collection('departments');
const Roles     = db.collection('roles');
const Activity  = db.collection('activitylogs');
const { ObjectId } = mongoose.Types;

// ── IDs ────────────────────────────────────────────────────────────────────
const ORG_ID     = new ObjectId('69d7af09bd444f6539aacd3c');  // lumyx org
const ADMIN_ID   = new ObjectId('69d7af09bd444f6539aacd3d');  // assi (admin)
const MAYA_ID    = new ObjectId('6a0c5e159d793751f2c13099');  // manager
const LEO_ID     = new ObjectId('6a0c5e179d793751f2c130a5');  // lead
const MIA_ID     = new ObjectId('6a0c5e189d793751f2c130b1');  // member
const VERA_ID    = new ObjectId('6a0c5e1a9d793751f2c130bd'); // viewer

const DEPT_LUMYX = new ObjectId('69d7af09bd444f6539aacd3b'); // existing dept

// Role IDs
const roles = await Roles.find({ organization: ORG_ID }).toArray();
const roleMap = Object.fromEntries(roles.map(r => [r.level, r._id]));
console.log('Roles:', Object.keys(roleMap).join(', '));

// ── 1. DELETE TEST DATA ────────────────────────────────────────────────────
console.log('\n🗑  Cleaning test data...');

await Tasks.deleteMany({ organization: ORG_ID });
console.log('  ✓ tasks deleted');

await Projects.deleteMany({ organization: ORG_ID });
console.log('  ✓ projects deleted');

await Activity.deleteMany({ organization: ORG_ID });
console.log('  ✓ activity logs deleted');

// Delete test1 & Test2
await Users.deleteMany({ email: { $in: ['julaytech@gmail.com', 'sedrert43@gmail.com'] } });
console.log('  ✓ test users (test1, Test2) deleted');

// ── 2. DEPARTMENTS ─────────────────────────────────────────────────────────
console.log('\n🏢 Setting up departments...');

await Depts.updateOne(
  { _id: DEPT_LUMYX },
  { $set: { name: 'Engineering', color: '#6366F1', description: 'Product development and infrastructure' } }
);

const DESIGN_DEPT_ID  = new ObjectId();
const OPS_DEPT_ID     = new ObjectId();

await Depts.insertMany([
  { _id: DESIGN_DEPT_ID, name: 'Product & Design', color: '#EC4899', description: 'UX research, product strategy, and visual design', organization: ORG_ID, memberCount: 2, createdAt: new Date(), updatedAt: new Date() },
  { _id: OPS_DEPT_ID,    name: 'Operations',       color: '#10B981', description: 'Project management, client relations, and business operations', organization: ORG_ID, memberCount: 2, createdAt: new Date(), updatedAt: new Date() },
]);
console.log('  ✓ 3 departments ready');

// ── 3. UPDATE USERS ────────────────────────────────────────────────────────
console.log('\n👥 Updating team profiles...');

const now = new Date();
const pass = await bcrypt.hash('Test@12345', 12);

await Users.updateOne({ _id: ADMIN_ID }, { $set: {
  name: 'Ahmed Assi', jobTitle: 'Founder & CEO',
  department: DEPT_LUMYX, status: 'active',
  skills: [{ name: 'Strategy', level: 5 }, { name: 'Product', level: 4 }, { name: 'Engineering', level: 4 }],
  performance: { score: 98, tasksCompleted: 42, tasksOverdue: 1, onTimeRate: 97 },
  availability: { hoursPerDay: 8, timezone: 'Asia/Dubai' },
}});

await Users.updateOne({ _id: MAYA_ID }, { $set: {
  name: 'Sarah Mitchell', jobTitle: 'Senior Project Manager',
  department: OPS_DEPT_ID, status: 'active',
  skills: [{ name: 'Agile', level: 5 }, { name: 'Risk Management', level: 4 }, { name: 'Stakeholder Mgmt', level: 5 }],
  performance: { score: 94, tasksCompleted: 38, tasksOverdue: 2, onTimeRate: 95 },
  availability: { hoursPerDay: 8, timezone: 'Asia/Dubai' },
}});

await Users.updateOne({ _id: LEO_ID }, { $set: {
  name: 'Omar Hassan', jobTitle: 'Engineering Lead',
  department: DEPT_LUMYX, status: 'active',
  skills: [{ name: 'Node.js', level: 5 }, { name: 'React', level: 5 }, { name: 'System Design', level: 4 }],
  performance: { score: 91, tasksCompleted: 51, tasksOverdue: 3, onTimeRate: 94 },
  availability: { hoursPerDay: 8, timezone: 'Asia/Dubai' },
}});

await Users.updateOne({ _id: MIA_ID }, { $set: {
  name: 'Lena Kraft', jobTitle: 'Full Stack Developer',
  department: DEPT_LUMYX, status: 'active',
  skills: [{ name: 'React', level: 4 }, { name: 'TypeScript', level: 4 }, { name: 'PostgreSQL', level: 3 }],
  performance: { score: 88, tasksCompleted: 29, tasksOverdue: 2, onTimeRate: 93 },
  availability: { hoursPerDay: 8, timezone: 'Europe/Berlin' },
}});

await Users.updateOne({ _id: VERA_ID }, { $set: {
  name: 'David Chen', jobTitle: 'Product Stakeholder',
  department: DESIGN_DEPT_ID, status: 'active',
  skills: [{ name: 'Product Strategy', level: 5 }, { name: 'Data Analysis', level: 4 }],
  performance: { score: 85, tasksCompleted: 12, tasksOverdue: 0, onTimeRate: 100 },
  availability: { hoursPerDay: 6, timezone: 'Asia/Singapore' },
}});

// New member: Nour (Designer)
const NOUR_ID = new ObjectId();
await Users.insertOne({
  _id: NOUR_ID,
  name: 'Nour Al-Rashid', email: 'nour.alrashid@lumyx.ae', password: pass,
  jobTitle: 'UI/UX Designer', organization: ORG_ID,
  role: roleMap['member'], department: DESIGN_DEPT_ID, status: 'active',
  skills: [{ name: 'Figma', level: 5 }, { name: 'Design Systems', level: 4 }, { name: 'Prototyping', level: 5 }],
  performance: { score: 92, tasksCompleted: 24, tasksOverdue: 1, onTimeRate: 96 },
  availability: { hoursPerDay: 8, timezone: 'Asia/Dubai' },
  createdAt: now, updatedAt: now,
});

console.log('  ✓ 6 team members updated/created');

// ── 4. PROJECTS ────────────────────────────────────────────────────────────
console.log('\n📁 Creating projects...');

const today = new Date();
const d = (n) => new Date(today.getTime() + n * 86400000);

const P1 = new ObjectId(); // E-Commerce Platform
const P2 = new ObjectId(); // Mobile Banking App
const P3 = new ObjectId(); // CRM Integration
const P4 = new ObjectId(); // Brand Identity

await Projects.insertMany([
  {
    _id: P1,
    name: 'E-Commerce Platform Redesign',
    description: 'Complete overhaul of the client\'s e-commerce platform — new checkout flow, performance optimization, and mobile-first responsive design.',
    status: 'active', priority: 'high', color: '#6366F1',
    organization: ORG_ID, createdBy: ADMIN_ID,
    startDate: d(-30), endDate: d(25),
    team: [
      { user: ADMIN_ID, role: 'owner' },
      { user: MAYA_ID,  role: 'manager' },
      { user: LEO_ID,   role: 'lead' },
      { user: MIA_ID,   role: 'member' },
      { user: NOUR_ID,  role: 'member' },
    ],
    progress: { percentage: 58, completedTasks: 7, totalTasks: 12 },
    health: 'on_track',
    tags: ['frontend', 'ux', 'performance'],
    createdAt: d(-30), updatedAt: now,
  },
  {
    _id: P2,
    name: 'Mobile Banking App',
    description: 'Cross-platform mobile application for a fintech client — secure authentication, transaction history, biometric login, and real-time notifications.',
    status: 'active', priority: 'critical', color: '#0EA5E9',
    organization: ORG_ID, createdBy: ADMIN_ID,
    startDate: d(-20), endDate: d(40),
    team: [
      { user: ADMIN_ID, role: 'owner' },
      { user: LEO_ID,   role: 'lead' },
      { user: MIA_ID,   role: 'member' },
      { user: VERA_ID,  role: 'member' },
    ],
    progress: { percentage: 35, completedTasks: 4, totalTasks: 11 },
    health: 'at_risk',
    tags: ['mobile', 'fintech', 'security'],
    createdAt: d(-20), updatedAt: now,
  },
  {
    _id: P3,
    name: 'CRM & Analytics Integration',
    description: 'Integrating Salesforce CRM with the client\'s internal analytics dashboard — automated data sync, custom reporting, and executive KPI views.',
    status: 'active', priority: 'medium', color: '#10B981',
    organization: ORG_ID, createdBy: MAYA_ID,
    startDate: d(-45), endDate: d(8),
    team: [
      { user: MAYA_ID,  role: 'manager' },
      { user: LEO_ID,   role: 'lead' },
      { user: MIA_ID,   role: 'member' },
    ],
    progress: { percentage: 82, completedTasks: 9, totalTasks: 11 },
    health: 'on_track',
    tags: ['crm', 'analytics', 'salesforce'],
    createdAt: d(-45), updatedAt: now,
  },
  {
    _id: P4,
    name: 'Brand Identity Refresh',
    description: 'Full brand refresh for a regional retail client — new logo, brand guidelines, social media kit, and marketing collateral.',
    status: 'completed', priority: 'low', color: '#F59E0B',
    organization: ORG_ID, createdBy: ADMIN_ID,
    startDate: d(-60), endDate: d(-5),
    team: [
      { user: ADMIN_ID, role: 'owner' },
      { user: NOUR_ID,  role: 'lead' },
      { user: MAYA_ID,  role: 'manager' },
      { user: VERA_ID,  role: 'member' },
    ],
    progress: { percentage: 100, completedTasks: 8, totalTasks: 8 },
    health: 'on_track',
    tags: ['branding', 'design'],
    createdAt: d(-60), updatedAt: d(-5),
  },
]);
console.log('  ✓ 4 projects created');

// ── 5. TASKS ───────────────────────────────────────────────────────────────
console.log('\n✅ Creating tasks...');

const tasks = [
  // ── E-Commerce Platform Redesign ──────────────────────────────────────
  { title: 'Redesign checkout flow — wireframes & prototypes',       project: P1, status: 'done',        priority: 'high',     assignees: [NOUR_ID],          dueDate: d(-10), estimatedHours: 12, startDate: d(-20), tags: ['design','ux'] },
  { title: 'Implement new product search with Elasticsearch',        project: P1, status: 'done',        priority: 'high',     assignees: [LEO_ID, MIA_ID],   dueDate: d(-8),  estimatedHours: 16, startDate: d(-18), tags: ['backend'] },
  { title: 'Checkout page — React frontend implementation',          project: P1, status: 'done',        priority: 'high',     assignees: [MIA_ID],           dueDate: d(-5),  estimatedHours: 14, startDate: d(-12), tags: ['frontend'] },
  { title: 'Payment gateway integration (Stripe)',                   project: P1, status: 'done',        priority: 'critical', assignees: [LEO_ID],           dueDate: d(-3),  estimatedHours: 10, startDate: d(-10), tags: ['backend','payments'] },
  { title: 'Mobile responsive layout — all pages',                  project: P1, status: 'done',        priority: 'high',     assignees: [MIA_ID, NOUR_ID],  dueDate: d(-2),  estimatedHours: 18, startDate: d(-14), tags: ['frontend','mobile'] },
  { title: 'Product image lazy loading & CDN setup',                project: P1, status: 'done',        priority: 'medium',   assignees: [LEO_ID],           dueDate: d(-1),  estimatedHours: 6,  startDate: d(-6),  tags: ['performance'] },
  { title: 'Homepage hero section A/B test variants',               project: P1, status: 'done',        priority: 'medium',   assignees: [NOUR_ID],          dueDate: d(-1),  estimatedHours: 8,  startDate: d(-8),  tags: ['design'] },
  { title: 'Shopping cart — persist across sessions',               project: P1, status: 'in_progress', priority: 'high',     assignees: [MIA_ID],           dueDate: d(4),   estimatedHours: 10, startDate: d(-2),  tags: ['frontend'] },
  { title: 'Performance audit — Core Web Vitals optimization',      project: P1, status: 'in_progress', priority: 'high',     assignees: [LEO_ID],           dueDate: d(6),   estimatedHours: 12, startDate: d(0),   tags: ['performance'] },
  { title: 'Admin dashboard — order management module',             project: P1, status: 'review',      priority: 'medium',   assignees: [MIA_ID, LEO_ID],   dueDate: d(3),   estimatedHours: 20, startDate: d(-5),  tags: ['backend','frontend'] },
  { title: 'Cross-browser QA testing — Chrome, Safari, Firefox',   project: P1, status: 'todo',        priority: 'high',     assignees: [NOUR_ID],          dueDate: d(12),  estimatedHours: 8,  startDate: d(5),   tags: ['qa'] },
  { title: 'Production deployment & DNS migration',                 project: P1, status: 'planned',     priority: 'critical', assignees: [LEO_ID, ADMIN_ID], dueDate: d(25),  estimatedHours: 6,  startDate: d(20),  tags: ['devops'] },

  // ── Mobile Banking App ────────────────────────────────────────────────
  { title: 'User authentication — JWT + biometric (Face ID)',        project: P2, status: 'done',        priority: 'critical', assignees: [LEO_ID],           dueDate: d(-12), estimatedHours: 20, startDate: d(-20), tags: ['security','mobile'] },
  { title: 'Onboarding screens — UI design & animations',           project: P2, status: 'done',        priority: 'high',     assignees: [NOUR_ID],          dueDate: d(-10), estimatedHours: 16, startDate: d(-18), tags: ['design','mobile'] },
  { title: 'Transaction history — list & detail views',             project: P2, status: 'done',        priority: 'high',     assignees: [MIA_ID],           dueDate: d(-7),  estimatedHours: 14, startDate: d(-14), tags: ['frontend','mobile'] },
  { title: 'Push notifications — Firebase Cloud Messaging',         project: P2, status: 'done',        priority: 'medium',   assignees: [LEO_ID],           dueDate: d(-5),  estimatedHours: 8,  startDate: d(-10), tags: ['backend','mobile'] },
  { title: 'Dashboard — balance cards & spending analytics',        project: P2, status: 'in_progress', priority: 'high',     assignees: [MIA_ID, NOUR_ID],  dueDate: d(5),   estimatedHours: 18, startDate: d(-3),  tags: ['frontend','mobile'] },
  { title: 'Money transfer flow — validation & confirmation',       project: P2, status: 'in_progress', priority: 'critical', assignees: [LEO_ID, MIA_ID],   dueDate: d(7),   estimatedHours: 22, startDate: d(-1),  tags: ['frontend','payments'] },
  { title: 'QR code payment — scan & generate',                    project: P2, status: 'todo',        priority: 'high',     assignees: [MIA_ID],           dueDate: d(15),  estimatedHours: 12, startDate: d(8),   tags: ['mobile'] },
  { title: 'Security penetration testing',                         project: P2, status: 'todo',        priority: 'critical', assignees: [LEO_ID, ADMIN_ID], dueDate: d(20),  estimatedHours: 16, startDate: d(15),  tags: ['security'] },
  { title: 'App Store & Google Play submission',                   project: P2, status: 'planned',     priority: 'high',     assignees: [ADMIN_ID],         dueDate: d(40),  estimatedHours: 6,  startDate: d(35),  tags: ['devops','mobile'] },
  { title: 'Accessibility audit — WCAG 2.1 compliance',           project: P2, status: 'planned',     priority: 'medium',   assignees: [NOUR_ID],          dueDate: d(30),  estimatedHours: 10, startDate: d(25),  tags: ['qa','accessibility'] },
  { title: 'Beta testing with 50 pilot users',                     project: P2, status: 'planned',     priority: 'high',     assignees: [MAYA_ID, VERA_ID], dueDate: d(35),  estimatedHours: 20, startDate: d(28),  tags: ['testing'] },

  // ── CRM & Analytics Integration ───────────────────────────────────────
  { title: 'Salesforce API authentication & OAuth setup',           project: P3, status: 'done',        priority: 'high',     assignees: [LEO_ID],           dueDate: d(-35), estimatedHours: 8,  startDate: d(-42), tags: ['backend','crm'] },
  { title: 'Contact & lead data sync — bidirectional',             project: P3, status: 'done',        priority: 'high',     assignees: [LEO_ID, MIA_ID],   dueDate: d(-28), estimatedHours: 20, startDate: d(-38), tags: ['backend','crm'] },
  { title: 'Deal pipeline — Kanban board UI',                      project: P3, status: 'done',        priority: 'medium',   assignees: [MIA_ID],           dueDate: d(-20), estimatedHours: 14, startDate: d(-28), tags: ['frontend'] },
  { title: 'Revenue analytics — charts & KPI widgets',             project: P3, status: 'done',        priority: 'high',     assignees: [MIA_ID, NOUR_ID],  dueDate: d(-15), estimatedHours: 18, startDate: d(-25), tags: ['frontend','analytics'] },
  { title: 'Automated email sequences — trigger setup',            project: P3, status: 'done',        priority: 'medium',   assignees: [LEO_ID],           dueDate: d(-12), estimatedHours: 10, startDate: d(-18), tags: ['automation'] },
  { title: 'Executive dashboard — PDF export & scheduling',        project: P3, status: 'done',        priority: 'medium',   assignees: [MIA_ID],           dueDate: d(-8),  estimatedHours: 12, startDate: d(-14), tags: ['frontend','reports'] },
  { title: 'Data migration — historical records (3 years)',        project: P3, status: 'done',        priority: 'high',     assignees: [LEO_ID],           dueDate: d(-6),  estimatedHours: 16, startDate: d(-12), tags: ['backend','data'] },
  { title: 'Real-time webhook sync — deal stage updates',          project: P3, status: 'done',        priority: 'medium',   assignees: [LEO_ID],           dueDate: d(-4),  estimatedHours: 8,  startDate: d(-8),  tags: ['backend'] },
  { title: 'User acceptance testing with client team',             project: P3, status: 'done',        priority: 'high',     assignees: [MAYA_ID, VERA_ID], dueDate: d(-2),  estimatedHours: 12, startDate: d(-6),  tags: ['qa'] },
  { title: 'Performance tuning — query optimization',             project: P3, status: 'in_progress', priority: 'medium',   assignees: [LEO_ID],           dueDate: d(3),   estimatedHours: 8,  startDate: d(-1),  tags: ['backend','performance'] },
  { title: 'Training session & handoff documentation',             project: P3, status: 'review',      priority: 'medium',   assignees: [MAYA_ID],          dueDate: d(5),   estimatedHours: 6,  startDate: d(0),   tags: ['documentation'] },
  { title: 'Production go-live & client sign-off',                 project: P3, status: 'todo',        priority: 'critical', assignees: [ADMIN_ID, MAYA_ID],dueDate: d(8),   estimatedHours: 4,  startDate: d(7),   tags: ['delivery'] },

  // ── Brand Identity Refresh (completed) ───────────────────────────────
  { title: 'Brand discovery workshop & competitor analysis',        project: P4, status: 'done',        priority: 'high',     assignees: [NOUR_ID, VERA_ID], dueDate: d(-50), estimatedHours: 8,  startDate: d(-58), tags: ['strategy','design'] },
  { title: 'Logo concepts — 3 directions',                         project: P4, status: 'done',        priority: 'high',     assignees: [NOUR_ID],          dueDate: d(-45), estimatedHours: 20, startDate: d(-55), tags: ['design'] },
  { title: 'Logo refinement & final approval',                     project: P4, status: 'done',        priority: 'high',     assignees: [NOUR_ID, VERA_ID], dueDate: d(-38), estimatedHours: 10, startDate: d(-45), tags: ['design'] },
  { title: 'Brand guidelines document (80 pages)',                  project: P4, status: 'done',        priority: 'medium',   assignees: [NOUR_ID],          dueDate: d(-25), estimatedHours: 24, startDate: d(-38), tags: ['design','documentation'] },
  { title: 'Social media template kit — 40 templates',             project: P4, status: 'done',        priority: 'medium',   assignees: [NOUR_ID],          dueDate: d(-15), estimatedHours: 30, startDate: d(-28), tags: ['design','social'] },
  { title: 'Marketing collateral — brochures & presentations',     project: P4, status: 'done',        priority: 'low',      assignees: [NOUR_ID, MAYA_ID], dueDate: d(-8),  estimatedHours: 16, startDate: d(-18), tags: ['design','marketing'] },
  { title: 'Brand asset delivery & client training',               project: P4, status: 'done',        priority: 'medium',   assignees: [MAYA_ID, VERA_ID], dueDate: d(-6),  estimatedHours: 4,  startDate: d(-7),  tags: ['delivery'] },
  { title: 'Final invoice & project closure',                      project: P4, status: 'done',        priority: 'low',      assignees: [ADMIN_ID, MAYA_ID],dueDate: d(-5),  estimatedHours: 2,  startDate: d(-5),  tags: ['admin'] },
];

const taskDocs = tasks.map(t => ({
  ...t,
  _id: new ObjectId(),
  organization: ORG_ID,
  createdBy: ADMIN_ID,
  estimatedHours: t.estimatedHours || 4,
  tags: t.tags || [],
  subtasks: [],
  createdAt: t.startDate || now,
  updatedAt: now,
}));

await Tasks.insertMany(taskDocs);
console.log(`  ✓ ${taskDocs.length} tasks created`);

// ── 6. ACTIVITY LOG ────────────────────────────────────────────────────────
console.log('\n📊 Adding activity log...');

const activityEntries = [
  { userId: ADMIN_ID,  userName: 'Ahmed Assi',      action: 'created',       entityType: 'project', entityName: 'Mobile Banking App',         organization: ORG_ID, timestamp: d(-20) },
  { userId: LEO_ID,    userName: 'Omar Hassan',      action: 'completed',     entityType: 'task',    entityName: 'User authentication module', organization: ORG_ID, timestamp: d(-12) },
  { userId: NOUR_ID,   userName: 'Nour Al-Rashid',   action: 'completed',     entityType: 'task',    entityName: 'Onboarding screens',          organization: ORG_ID, timestamp: d(-10) },
  { userId: MIA_ID,    userName: 'Lena Kraft',       action: 'status_changed',entityType: 'task',    entityName: 'Shopping cart persistence',   organization: ORG_ID, timestamp: d(-2) },
  { userId: MAYA_ID,   userName: 'Sarah Mitchell',   action: 'assigned',      entityType: 'task',    entityName: 'Beta testing with pilot users',organization: ORG_ID, timestamp: d(-1) },
  { userId: LEO_ID,    userName: 'Omar Hassan',      action: 'status_changed',entityType: 'task',    entityName: 'Performance audit',           organization: ORG_ID, timestamp: d(0) },
  { userId: MIA_ID,    userName: 'Lena Kraft',       action: 'updated',       entityType: 'task',    entityName: 'Money transfer flow',         organization: ORG_ID, timestamp: d(0) },
  { userId: MAYA_ID,   userName: 'Sarah Mitchell',   action: 'completed',     entityType: 'task',    entityName: 'Training & documentation',    organization: ORG_ID, timestamp: d(0) },
  { userId: ADMIN_ID,  userName: 'Ahmed Assi',       action: 'created',       entityType: 'task',    entityName: 'Production go-live',          organization: ORG_ID, timestamp: d(0) },
];

await Activity.insertMany(activityEntries.map(a => ({ ...a, _id: new ObjectId(), createdAt: a.timestamp, updatedAt: a.timestamp })));
console.log(`  ✓ ${activityEntries.length} activity entries added`);

// ── SUMMARY ────────────────────────────────────────────────────────────────
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('✅ DONE — Presentation data ready')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('👥  Team:     Ahmed Assi · Sarah Mitchell · Omar Hassan · Lena Kraft · Nour Al-Rashid · David Chen')
console.log('📁  Projects: E-Commerce Redesign · Mobile Banking App · CRM Integration · Brand Identity')
console.log(`✅  Tasks:    ${taskDocs.length} tasks across 4 projects`)
console.log('🏢  Depts:    Engineering · Product & Design · Operations')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

await mongoose.disconnect();
process.exit(0);
