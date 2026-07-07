/**
 * Marketing Demo Seed — populates the admin's organization with realistic
 * "Lumyx Digital" agency data for marketing screenshots / recordings.
 *
 * SAFETY:
 *   - Targets ONLY the organization owned by ADMIN_EMAIL (aborts if not found).
 *   - Backs up that org's projects/tasks/activitylogs/demo-users to a JSON file
 *     under backend/_backups/ BEFORE deleting anything (reversible).
 *   - Never deletes the real admin account, the organization, or its roles.
 *
 * Usage on server:  cd backend && node seed-marketing-demo.mjs
 * Override target:   ADMIN_EMAIL=you@example.com node seed-marketing-demo.mjs
 */
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '.env') });

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'assimohammad489@gmail.com').toLowerCase();
const DEMO_DOMAIN = 'lumyx.demo';                 // demo teammates use this domain
const DEMO_PASS   = 'Demo@12345';                 // shared password for demo teammates

await mongoose.connect(process.env.MONGODB_URI);
const db = mongoose.connection.db;
const { ObjectId } = mongoose.Types;
console.log('✅ Connected to', db.databaseName);

const Users    = db.collection('users');
const Orgs     = db.collection('organizations');
const Depts    = db.collection('departments');
const Roles    = db.collection('roles');
const Projects = db.collection('projects');
const Tasks    = db.collection('tasks');
const Activity = db.collection('activitylogs');

// ── 0. Locate admin + org (abort if missing) ────────────────────────────────
const admin = await Users.findOne({ email: ADMIN_EMAIL });
if (!admin) { console.error(`❌ Admin ${ADMIN_EMAIL} not found. Aborting — nothing changed.`); process.exit(1); }
const ORG = admin.organization;
if (!ORG) { console.error('❌ Admin has no organization. Aborting.'); process.exit(1); }
console.log(`👤 Admin: ${admin.name} <${admin.email}>  org=${ORG}`);

// ── 1. BACKUP org data before touching anything ─────────────────────────────
const q = { organization: ORG };
const backup = {
  when: new Date().toISOString(), org: String(ORG), adminEmail: ADMIN_EMAIL,
  projects: await Projects.find(q).toArray(),
  tasks:    await Tasks.find(q).toArray(),
  activity: await Activity.find(q).toArray(),
  users:    await Users.find(q).toArray(),
};
const backupsDir = join(__dirname, '_backups');
fs.mkdirSync(backupsDir, { recursive: true });
const backupFile = join(backupsDir, `org-${String(ORG)}-${Date.now()}.json`);
fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
console.log(`💾 Backup written: ${backupFile}`);
console.log(`   (projects=${backup.projects.length} tasks=${backup.tasks.length} activity=${backup.activity.length} users=${backup.users.length})`);

// ── 2. Clean previous data for THIS org only ────────────────────────────────
await Tasks.deleteMany(q);
await Projects.deleteMany(q);
await Activity.deleteMany(q);
await Users.deleteMany({ organization: ORG, email: { $regex: `@${DEMO_DOMAIN}$`, $options: 'i' } });
console.log('🗑  Cleared old tasks / projects / activity / previous demo teammates');

// ── 3. Brand the workspace ──────────────────────────────────────────────────
await Orgs.updateOne({ _id: ORG }, { $set: { name: 'Lumyx Digital', industry: 'technology', updatedAt: new Date() } });

// ── 4. Roles (use existing per-org roles) ───────────────────────────────────
const roles = await Roles.find({ organization: ORG }).toArray();
const roleByLevel = Object.fromEntries(roles.map(r => [r.level, r._id]));
const roleFor = (lvl) => roleByLevel[lvl] || roleByLevel['member'] || admin.role;

// ── 5. Departments ──────────────────────────────────────────────────────────
const now = new Date();
const deptDefs = [
  { key: 'eng',  name: 'Engineering', color: '#4F46E5', icon: 'code' },
  { key: 'design', name: 'Design',    color: '#EC4899', icon: 'brush' },
  { key: 'ops',  name: 'Operations',  color: '#10B981', icon: 'work' },
  { key: 'mkt',  name: 'Marketing',   color: '#F59E0B', icon: 'campaign' },
];
const deptId = {};
for (const d of deptDefs) {
  let doc = await Depts.findOne({ organization: ORG, name: d.name });
  if (!doc) {
    const _id = new ObjectId();
    await Depts.insertOne({ _id, name: d.name, organization: ORG, color: d.color, icon: d.icon, memberCount: 0, isDefault: false, createdAt: now, updatedAt: now });
    doc = { _id };
  }
  deptId[d.key] = doc._id;
}
console.log('🏢 Departments ready');

// ── 6. Team members ─────────────────────────────────────────────────────────
const pass = await bcrypt.hash(DEMO_PASS, 12);
const teamDefs = [
  { name: 'Sarah Mitchell', jt: 'Senior Project Manager', dep: 'ops',    lvl: 'manager', tz: 'Asia/Dubai',      skills: [['Agile',5],['Risk Management',4],['Stakeholder Mgmt',5]], perf: [94,38,2,95] },
  { name: 'Omar Hassan',    jt: 'Engineering Lead',        dep: 'eng',    lvl: 'lead',    tz: 'Asia/Dubai',      skills: [['Node.js',5],['React',5],['System Design',4]],         perf: [91,51,3,94] },
  { name: 'Lena Kraft',     jt: 'Full Stack Developer',    dep: 'eng',    lvl: 'member',  tz: 'Europe/Berlin',   skills: [['React',4],['TypeScript',4],['PostgreSQL',3]],          perf: [88,29,2,93] },
  { name: 'Nour Al-Rashid', jt: 'UI/UX Designer',          dep: 'design', lvl: 'member',  tz: 'Asia/Dubai',      skills: [['Figma',5],['Design Systems',4],['Prototyping',5]],     perf: [92,24,1,96] },
  { name: 'David Chen',     jt: 'Marketing Specialist',    dep: 'mkt',    lvl: 'member',  tz: 'Asia/Singapore',  skills: [['SEO',5],['Content Strategy',4],['Analytics',4]],       perf: [86,19,0,98] },
];
const team = {}; // name -> _id
for (const m of teamDefs) {
  const _id = new ObjectId();
  const email = `${m.name.toLowerCase().replace(/[^a-z]+/g, '.')}@${DEMO_DOMAIN}`;
  await Users.insertOne({
    _id, name: m.name, email, password: pass, organization: ORG,
    role: roleFor(m.lvl), department: deptId[m.dep], jobTitle: m.jt, status: 'active',
    skills: m.skills.map(([name, level]) => ({ name, level })),
    performance: { score: m.perf[0], tasksCompleted: m.perf[1], tasksOverdue: m.perf[2], onTimeRate: m.perf[3] },
    availability: { hoursPerDay: 8, timezone: m.tz },
    isAdmin: false, lastActive: now, createdAt: now, updatedAt: now,
  });
  team[m.name] = _id;
}
// Give the real admin a polished title (keep name/email/password untouched)
await Users.updateOne({ _id: admin._id }, { $set: {
  jobTitle: 'Founder & CEO', department: deptId.eng, status: 'active',
  performance: { score: 98, tasksCompleted: 42, tasksOverdue: 1, onTimeRate: 97 },
} });
const AD = admin._id;
console.log('👥 Team ready (5 teammates + admin)');

// ── 7. Projects ─────────────────────────────────────────────────────────────
const d = (n) => new Date(now.getTime() + n * 86400000);
const mkMembers = (...names) => names.map((n, i) => ({ user: n === 'admin' ? AD : team[n], role: i === 0 ? 'owner' : 'member' }));
const projDefs = [
  { key: 'P1', name: 'Mobile Banking App',            status: 'active',    priority: 'high',     color: '#4F46E5', dep: 'eng',    start: -40, end: 25, members: ['admin','Omar Hassan','Lena Kraft'] },
  { key: 'P2', name: 'E-commerce Platform Redesign',  status: 'active',    priority: 'critical', color: '#EC4899', dep: 'design', start: -25, end: 20, members: ['Sarah Mitchell','Nour Al-Rashid','Lena Kraft'] },
  { key: 'P3', name: 'Marketing Website Revamp',       status: 'active',    priority: 'medium',   color: '#F59E0B', dep: 'mkt',    start: -18, end: 12, members: ['David Chen','Nour Al-Rashid'] },
  { key: 'P4', name: 'Internal Analytics Dashboard',   status: 'planning',  priority: 'medium',   color: '#0EA5E9', dep: 'eng',    start: -6,  end: 45, members: ['Omar Hassan','admin'] },
  { key: 'P5', name: 'Customer Support Portal',        status: 'completed', priority: 'low',      color: '#10B981', dep: 'ops',    start: -70, end: -8, members: ['Sarah Mitchell','Lena Kraft'] },
];
const P = {};
for (const p of projDefs) {
  const _id = new ObjectId();
  await Projects.insertOne({
    _id, name: p.name, organization: ORG, status: p.status, priority: p.priority,
    startDate: d(p.start), endDate: d(p.end), color: p.color,
    departments: [deptId[p.dep]], members: mkMembers(...p.members), createdBy: AD,
    tags: [], progress: { percentage: 0, completedTasks: 0, totalTasks: 0 },
    createdAt: d(p.start), updatedAt: now,
  });
  P[p.key] = _id;
}
console.log('📁 Projects created:', projDefs.length);

// ── 8. Tasks ────────────────────────────────────────────────────────────────
// [title, projectKey, status, priority, assigneeName, dueOffsetDays, estHours]
const T = [
  ['Design account onboarding flow',        'P1','done',        'high',    'Nour Al-Rashid', -14, 12],
  ['Implement biometric login',             'P1','in_progress', 'critical','Omar Hassan',      3, 16],
  ['Set up push notifications',             'P1','todo',        'medium',  'Lena Kraft',       6, 10],
  ['Card transactions API integration',     'P1','review',      'high',    'Omar Hassan',      2, 14],
  ['QA regression on transfers',            'P1','testing',     'high',    'Lena Kraft',       5,  8],
  ['App Store submission prep',             'P1','planned',     'medium',  'Sarah Mitchell',  10,  4],

  ['New product page layout',               'P2','done',        'high',    'Nour Al-Rashid', -10, 10],
  ['Cart & checkout redesign',              'P2','in_progress', 'critical','Lena Kraft',       4, 18],
  ['Design system component audit',         'P2','in_progress', 'medium',  'Nour Al-Rashid',   7, 12],
  ['Migrate to headless CMS',               'P2','blocked',     'high',    'Omar Hassan',      1, 20],
  ['Performance budget & Lighthouse pass',  'P2','todo',        'medium',  'Lena Kraft',       9,  8],

  ['SEO content refresh — landing pages',   'P3','done',        'medium',  'David Chen',      -6,  6],
  ['New hero + testimonials section',       'P3','in_progress', 'medium',  'Nour Al-Rashid',   3,  8],
  ['Blog migration to new template',        'P3','todo',        'low',     'David Chen',       8,  6],
  ['Analytics & conversion tracking',       'P3','review',      'medium',  'David Chen',       2,  4],

  ['Define dashboard KPIs',                 'P4','planned',     'medium',  'Sarah Mitchell',  12,  5],
  ['Data warehouse schema draft',           'P4','todo',        'high',    'Omar Hassan',     15, 14],
  ['Wireframe key charts',                  'P4','planned',     'low',     'Nour Al-Rashid',  18,  6],

  ['Ticketing workflow implementation',     'P5','done',        'high',    'Lena Kraft',     -20, 16],
  ['Knowledge base articles',               'P5','done',        'low',     'David Chen',     -15,  8],
  ['SLA reporting module',                  'P5','done',        'medium',  'Omar Hassan',    -12, 10],
  ['Handover & documentation',              'P5','done',        'low',     'Sarah Mitchell', -10,  4],

  ['Weekly stakeholder sync notes',         'P1','done',        'low',     'Sarah Mitchell',  -3,  2],
  ['Accessibility audit (WCAG AA)',         'P2','todo',        'medium',  'Nour Al-Rashid',  11,  6],
  ['Email campaign for relaunch',           'P3','planned',     'medium',  'David Chen',      14,  5],
  ['Refactor auth middleware',              'P1','in_progress', 'high',    'Lena Kraft',       5,  9],
];
const taskDocs = T.map(([title, pk, status, priority, who, due, est]) => {
  const isDone = status === 'done';
  return {
    _id: new ObjectId(), title, organization: ORG, project: P[pk], status, priority,
    assignees: who ? [team[who] || AD] : [], reporter: AD,
    dueDate: d(due), startDate: d(due - 7), estimatedHours: est,
    actualHours: isDone ? est : 0, completedAt: isDone ? d(due) : null,
    tags: [], createdAt: d(due - 7), updatedAt: now,
  };
});
await Tasks.insertMany(taskDocs);
console.log('✅ Tasks created:', taskDocs.length);

// Update project progress counters
for (const p of projDefs) {
  const total = taskDocs.filter(t => String(t.project) === String(P[p.key])).length;
  const done  = taskDocs.filter(t => String(t.project) === String(P[p.key]) && t.status === 'done').length;
  await Projects.updateOne({ _id: P[p.key] }, { $set: { 'progress.totalTasks': total, 'progress.completedTasks': done, 'progress.percentage': total ? Math.round(done / total * 100) : 0 } });
}

// ── 9. Activity feed (recent, realistic) ────────────────────────────────────
const nameOf = { admin: admin.name };
Object.entries(team).forEach(([n]) => (nameOf[n] = n));
const uidOf = (n) => (n === 'admin' ? AD : team[n]);
const A = [
  ['Omar Hassan',   'status_changed', 'task',    'Implement biometric login',        -0.2],
  ['Nour Al-Rashid','completed',      'task',    'New product page layout',          -0.4],
  ['Lena Kraft',    'created',        'task',    'Refactor auth middleware',         -0.8],
  ['Sarah Mitchell','commented',      'task',    'App Store submission prep',        -1.1],
  ['David Chen',    'completed',      'task',    'SEO content refresh — landing pages', -1.5],
  ['admin',         'created',        'project', 'Internal Analytics Dashboard',     -2.0],
  ['Omar Hassan',   'status_changed', 'task',    'Migrate to headless CMS',          -2.4],
  ['Lena Kraft',    'assigned',       'task',    'Cart & checkout redesign',         -3.0],
  ['Nour Al-Rashid','updated',        'task',    'Design system component audit',    -3.5],
  ['Sarah Mitchell','completed',      'task',    'Handover & documentation',         -4.0],
  ['David Chen',    'created',        'task',    'Email campaign for relaunch',      -4.6],
  ['admin',         'status_changed', 'project', 'Customer Support Portal',          -5.2],
  ['Omar Hassan',   'completed',      'task',    'SLA reporting module',             -6.0],
  ['Lena Kraft',    'completed',      'task',    'Ticketing workflow implementation',-6.8],
];
const findTaskId = (name) => taskDocs.find(t => t.title === name)?._id;
const activityDocs = A.map(([who, action, etype, ename, off]) => ({
  _id: new ObjectId(), organization: ORG, user: uidOf(who), userName: nameOf[who] || who,
  action, entityType: etype,
  entityId: etype === 'project' ? (Object.values(P).find(Boolean) || new ObjectId()) : (findTaskId(ename) || new ObjectId()),
  entityName: ename, timestamp: d(off), createdAt: d(off), updatedAt: d(off),
}));
await Activity.insertMany(activityDocs);
console.log('📰 Activity entries created:', activityDocs.length);

// ── Done ────────────────────────────────────────────────────────────────────
console.log('\n🎉 Marketing demo ready for "Lumyx Digital"');
console.log(`   Log in as: ${admin.email} (your existing password)`);
console.log(`   Demo teammates password: ${DEMO_PASS}`);
console.log(`   Backup saved at: ${backupFile}`);
await mongoose.disconnect();
