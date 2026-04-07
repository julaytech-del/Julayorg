import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Organization from '../models/Organization.js';
import Department from '../models/Department.js';
import Role from '../models/Role.js';
import User from '../models/User.js';
import Project from '../models/Project.js';
import Goal from '../models/Goal.js';
import Task from '../models/Task.js';
import ActivityLog from '../models/ActivityLog.js';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/julay';

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  // Clear all collections
  await Promise.all([
    Organization.deleteMany({}),
    Department.deleteMany({}),
    Role.deleteMany({}),
    User.deleteMany({}),
    Project.deleteMany({}),
    Goal.deleteMany({}),
    Task.deleteMany({}),
    ActivityLog.deleteMany({})
  ]);
  console.log('Cleared existing data');

  // ─── Organization ────────────────────────────────────
  const org = await Organization.create({
    name: 'TechCorp Solutions',
    industry: 'technology',
    description: 'A leading technology company specializing in digital transformation',
    settings: { timezone: 'UTC', currency: 'USD', workingDays: [1,2,3,4,5] },
    subscription: { plan: 'pro' }
  });
  console.log('Created organization:', org.name);

  // ─── Roles ────────────────────────────────────────────
  const fullPerms = { create: true, read: true, update: true, delete: true };
  const readOnly = { create: false, read: true, update: false, delete: false };
  const memberPerms = { create: true, read: true, update: true, delete: false };

  const roles = await Role.insertMany([
    { name: 'Admin', organization: org._id, level: 'admin', isDefault: true, permissions: { projects: fullPerms, tasks: { ...fullPerms, assign: true }, users: fullPerms, departments: fullPerms, ai: { use: true, configure: true }, reports: { view: true, export: true } } },
    { name: 'Manager', organization: org._id, level: 'manager', permissions: { projects: { ...memberPerms, delete: true }, tasks: { ...fullPerms, assign: true }, users: { ...readOnly, update: true }, departments: { ...readOnly, update: true }, ai: { use: true, configure: false }, reports: { view: true, export: true } } },
    { name: 'Lead', organization: org._id, level: 'lead', permissions: { projects: { ...readOnly, update: true }, tasks: { ...memberPerms, assign: true }, users: readOnly, departments: readOnly, ai: { use: true, configure: false }, reports: { view: true, export: false } } },
    { name: 'Member', organization: org._id, level: 'member', permissions: { projects: readOnly, tasks: memberPerms, users: readOnly, departments: readOnly, ai: { use: false, configure: false }, reports: { view: false, export: false } } },
    { name: 'Viewer', organization: org._id, level: 'viewer', permissions: { projects: readOnly, tasks: readOnly, users: readOnly, departments: readOnly, ai: { use: false, configure: false }, reports: { view: true, export: false } } }
  ]);
  const [adminRole, managerRole, leadRole, memberRole] = roles;
  console.log('Created roles');

  // ─── Departments ─────────────────────────────────────
  const departments = await Department.insertMany([
    { name: 'Project Management', organization: org._id, description: 'Coordinates all project deliveries', color: '#6366F1', icon: 'dashboard' },
    { name: 'Design', organization: org._id, description: 'UI/UX and visual design', color: '#EC4899', icon: 'palette' },
    { name: 'Development', organization: org._id, description: 'Frontend and backend engineering', color: '#10B981', icon: 'code' },
    { name: 'Marketing', organization: org._id, description: 'SEO, content and campaigns', color: '#F59E0B', icon: 'trending_up' },
    { name: 'Quality Assurance', organization: org._id, description: 'Testing and quality control', color: '#EF4444', icon: 'verified' }
  ]);
  const [pmDept, designDept, devDept, marketDept, qaDept] = departments;
  console.log('Created departments');

  // ─── Users ────────────────────────────────────────────
  const hashPwd = await bcrypt.hash('password123', 12);

  const users = await User.insertMany([
    { name: 'Alex Admin', email: 'admin@techcorp.com', password: hashPwd, organization: org._id, department: pmDept._id, role: adminRole._id, jobTitle: 'CTO', isAdmin: true, status: 'active', skills: [{ name: 'Leadership', level: 5, category: 'management' }, { name: 'Strategy', level: 5, category: 'management' }, { name: 'Project Management', level: 5, category: 'management' }], availability: { hoursPerDay: 8 } },
    { name: 'Patricia Manager', email: 'pm@techcorp.com', password: hashPwd, organization: org._id, department: pmDept._id, role: managerRole._id, jobTitle: 'Project Manager', status: 'active', skills: [{ name: 'Project Management', level: 5, category: 'management' }, { name: 'Agile', level: 4, category: 'methodology' }, { name: 'Communication', level: 5, category: 'soft' }], availability: { hoursPerDay: 8 } },
    { name: 'Diana Designer', email: 'designer@techcorp.com', password: hashPwd, organization: org._id, department: designDept._id, role: leadRole._id, jobTitle: 'Senior UI/UX Designer', status: 'active', skills: [{ name: 'Figma', level: 5, category: 'design' }, { name: 'UI Design', level: 5, category: 'design' }, { name: 'UX Research', level: 4, category: 'design' }, { name: 'Prototyping', level: 5, category: 'design' }], availability: { hoursPerDay: 8 } },
    { name: 'Frank Frontend', email: 'frontend@techcorp.com', password: hashPwd, organization: org._id, department: devDept._id, role: memberRole._id, jobTitle: 'Frontend Developer', status: 'active', skills: [{ name: 'React', level: 5, category: 'frontend' }, { name: 'JavaScript', level: 5, category: 'frontend' }, { name: 'CSS', level: 4, category: 'frontend' }, { name: 'TypeScript', level: 4, category: 'frontend' }], availability: { hoursPerDay: 8 } },
    { name: 'Ben Backend', email: 'backend@techcorp.com', password: hashPwd, organization: org._id, department: devDept._id, role: memberRole._id, jobTitle: 'Backend Developer', status: 'active', skills: [{ name: 'Node.js', level: 5, category: 'backend' }, { name: 'MongoDB', level: 4, category: 'backend' }, { name: 'API Design', level: 5, category: 'backend' }, { name: 'DevOps', level: 3, category: 'devops' }], availability: { hoursPerDay: 8 } },
    { name: 'Maria Marketer', email: 'marketer@techcorp.com', password: hashPwd, organization: org._id, department: marketDept._id, role: memberRole._id, jobTitle: 'Digital Marketing Specialist', status: 'active', skills: [{ name: 'SEO', level: 5, category: 'marketing' }, { name: 'Content Strategy', level: 4, category: 'marketing' }, { name: 'Google Analytics', level: 4, category: 'analytics' }], availability: { hoursPerDay: 8 } },
    { name: 'Chris Writer', email: 'writer@techcorp.com', password: hashPwd, organization: org._id, department: marketDept._id, role: memberRole._id, jobTitle: 'Content Writer', status: 'active', skills: [{ name: 'Copywriting', level: 5, category: 'content' }, { name: 'SEO Writing', level: 4, category: 'content' }, { name: 'Blog Writing', level: 5, category: 'content' }], availability: { hoursPerDay: 8 } },
    { name: 'Quinn QA', email: 'qa@techcorp.com', password: hashPwd, organization: org._id, department: qaDept._id, role: memberRole._id, jobTitle: 'QA Engineer', status: 'active', skills: [{ name: 'Manual Testing', level: 5, category: 'qa' }, { name: 'Cypress', level: 4, category: 'qa' }, { name: 'Test Planning', level: 4, category: 'qa' }], availability: { hoursPerDay: 8 } }
  ]);
  const [admin, pm, designer, frontend, backend, marketer, writer, qa] = users;
  console.log('Created users');

  // Update department heads
  await Department.findByIdAndUpdate(pmDept._id, { head: pm._id });
  await Department.findByIdAndUpdate(designDept._id, { head: designer._id });
  await Department.findByIdAndUpdate(devDept._id, { head: frontend._id });
  await Department.findByIdAndUpdate(marketDept._id, { head: marketer._id });
  await Department.findByIdAndUpdate(qaDept._id, { head: qa._id });

  // ─── PROJECT 1: Company Website (AI-Generated Example) ────
  const projectStart = new Date('2026-01-15');
  const project1 = await Project.create({
    name: 'TechCorp Company Website',
    description: 'Complete company website with modern design, CMS integration, SEO optimization, and responsive layout across all devices.',
    organization: org._id,
    industry: 'technology',
    status: 'active',
    priority: 'high',
    startDate: projectStart,
    endDate: new Date('2026-03-15'),
    team: [
      { user: admin._id, role: 'owner' },
      { user: pm._id, role: 'manager' },
      { user: designer._id, role: 'member' },
      { user: frontend._id, role: 'member' },
      { user: backend._id, role: 'member' },
      { user: marketer._id, role: 'member' },
      { user: writer._id, role: 'member' },
      { user: qa._id, role: 'member' }
    ],
    departments: [pmDept._id, designDept._id, devDept._id, marketDept._id, qaDept._id],
    aiGenerated: true,
    aiMetadata: { originalPrompt: 'Build a company website', generatedAt: new Date('2026-01-10'), confidence: 0.92, detectedIndustry: 'technology' },
    color: '#6366F1',
    createdBy: admin._id
  });

  // ─── GOALS ────────────────────────────────────────────
  const goal1 = await Goal.create({ title: 'Requirements & Strategy', description: 'Define scope, gather requirements, plan architecture', project: project1._id, order: 1, dueDate: new Date('2026-01-22'), color: '#6366F1', status: 'completed', progress: 100, aiGenerated: true });
  const goal2 = await Goal.create({ title: 'UI/UX Design', description: 'Brand identity, wireframes, and high-fidelity mockups', project: project1._id, order: 2, dueDate: new Date('2026-02-07'), color: '#EC4899', status: 'completed', progress: 100, aiGenerated: true });
  const goal3 = await Goal.create({ title: 'Frontend Development', description: 'Build all pages with responsive design', project: project1._id, order: 3, dueDate: new Date('2026-02-25'), color: '#10B981', status: 'in_progress', progress: 55, aiGenerated: true });
  const goal4 = await Goal.create({ title: 'Backend & CMS Integration', description: 'API development, CMS setup, and email integration', project: project1._id, order: 4, dueDate: new Date('2026-02-28'), color: '#8B5CF6', status: 'in_progress', progress: 40, aiGenerated: true });
  const goal5 = await Goal.create({ title: 'Content Creation', description: 'Copywriting, blog posts, and media assets', project: project1._id, order: 5, dueDate: new Date('2026-03-05'), color: '#F59E0B', status: 'not_started', progress: 0, aiGenerated: true });
  const goal6 = await Goal.create({ title: 'Testing, Launch & SEO', description: 'QA testing, SEO implementation, and production deployment', project: project1._id, order: 6, dueDate: new Date('2026-03-15'), color: '#EF4444', status: 'not_started', progress: 0, aiGenerated: true });

  console.log('Created goals');

  // ─── TASKS - GOAL 1: Requirements & Strategy ──────────
  const tasks_g1 = await Task.insertMany([
    {
      title: 'Stakeholder Requirements Workshop',
      description: 'Conduct workshops to gather and document all stakeholder requirements, business goals, and success metrics for the website.',
      project: project1._id, goal: goal1._id,
      status: 'done', type: 'meeting', priority: 'high',
      assignees: [pm._id], reporter: admin._id,
      startDate: new Date('2026-01-15'), dueDate: new Date('2026-01-17'), completedAt: new Date('2026-01-17'),
      estimatedHours: 8, actualHours: 9, position: 1,
      subtasks: [{ title: 'Prepare workshop agenda', status: 'done', completedAt: new Date('2026-01-15') }, { title: 'Conduct stakeholder meeting', status: 'done', completedAt: new Date('2026-01-16') }, { title: 'Document requirements', status: 'done', completedAt: new Date('2026-01-17') }, { title: 'Get stakeholder sign-off', status: 'done', completedAt: new Date('2026-01-17') }],
      tools: [{ name: 'Notion', category: 'other', url: 'notion.so', description: 'Requirements documentation' }],
      aiGenerated: true, aiMetadata: { reason: 'Critical first step for any web project', skillsRequired: ['Project Management', 'Communication'] },
      department: pmDept._id, createdBy: admin._id
    },
    {
      title: 'Competitive Analysis & Market Research',
      description: 'Research and analyze 5 competitor websites. Document findings on design patterns, features, SEO strategies, and differentiators.',
      project: project1._id, goal: goal1._id,
      status: 'done', type: 'research', priority: 'high',
      assignees: [marketer._id], reporter: pm._id,
      startDate: new Date('2026-01-16'), dueDate: new Date('2026-01-20'), completedAt: new Date('2026-01-19'),
      estimatedHours: 16, actualHours: 14, position: 2,
      subtasks: [{ title: 'Identify top 5 competitors', status: 'done' }, { title: 'Analyze websites and UX', status: 'done' }, { title: 'Document findings', status: 'done' }, { title: 'Present report to team', status: 'done' }],
      tools: [{ name: 'Ahrefs', category: 'analytics', url: 'ahrefs.com', description: 'Competitor SEO analysis' }, { name: 'SimilarWeb', category: 'analytics', url: 'similarweb.com', description: 'Traffic and audience analysis' }],
      aiGenerated: true, aiMetadata: { reason: 'Essential for positioning and feature planning', skillsRequired: ['Marketing', 'Research'] },
      department: marketDept._id, createdBy: admin._id
    },
    {
      title: 'Technical Architecture Planning',
      description: 'Define tech stack, database schema, API structure, hosting infrastructure, and create comprehensive architecture documentation.',
      project: project1._id, goal: goal1._id,
      status: 'done', type: 'planning', priority: 'critical',
      assignees: [backend._id], reporter: admin._id,
      startDate: new Date('2026-01-17'), dueDate: new Date('2026-01-20'), completedAt: new Date('2026-01-20'),
      estimatedHours: 12, actualHours: 10, position: 3,
      subtasks: [{ title: 'Define tech stack', status: 'done' }, { title: 'Plan database schema', status: 'done' }, { title: 'Define API structure', status: 'done' }, { title: 'Create architecture diagram', status: 'done' }],
      tools: [{ name: 'Lucidchart', category: 'design', url: 'lucidchart.com', description: 'Architecture diagrams' }, { name: 'Notion', category: 'other', url: 'notion.so', description: 'Tech docs' }],
      aiGenerated: true, aiMetadata: { reason: 'Architecture decisions impact entire project', skillsRequired: ['Node.js', 'System Design'] },
      department: devDept._id, createdBy: admin._id
    },
    {
      title: 'Project Repository & CI/CD Setup',
      description: 'Initialize Git repository, configure CI/CD pipeline with GitHub Actions, set up development/staging/production environments.',
      project: project1._id, goal: goal1._id,
      status: 'done', type: 'planning', priority: 'high',
      assignees: [frontend._id], reporter: pm._id,
      startDate: new Date('2026-01-20'), dueDate: new Date('2026-01-22'), completedAt: new Date('2026-01-21'),
      estimatedHours: 6, actualHours: 5, position: 4,
      subtasks: [{ title: 'Initialize repository', status: 'done' }, { title: 'Configure CI/CD pipeline', status: 'done' }, { title: 'Set up environments', status: 'done' }, { title: 'Create README', status: 'done' }],
      tools: [{ name: 'GitHub', category: 'development', url: 'github.com', description: 'Source control and CI/CD' }, { name: 'GitHub Actions', category: 'development', url: 'github.com/features/actions', description: 'CI/CD automation' }],
      aiGenerated: true, aiMetadata: { reason: 'Foundation for all development work', skillsRequired: ['DevOps', 'Git'] },
      department: devDept._id, createdBy: admin._id
    }
  ]);

  // ─── TASKS - GOAL 2: UI/UX Design ─────────────────────
  const tasks_g2 = await Task.insertMany([
    {
      title: 'Brand Identity & Style Guide',
      description: 'Define complete brand identity: color palette, typography, logo usage, spacing system, and export a design token library for developers.',
      project: project1._id, goal: goal2._id,
      status: 'done', type: 'design', priority: 'critical',
      assignees: [designer._id], reporter: pm._id,
      startDate: new Date('2026-01-22'), dueDate: new Date('2026-01-28'), completedAt: new Date('2026-01-27'),
      estimatedHours: 24, actualHours: 22, position: 5,
      subtasks: [{ title: 'Color palette & brand colors', status: 'done' }, { title: 'Typography system', status: 'done' }, { title: 'Component design tokens', status: 'done' }, { title: 'Export assets and handoff docs', status: 'done' }],
      tools: [{ name: 'Figma', category: 'design', url: 'figma.com', description: 'Primary design tool' }, { name: 'Coolors', category: 'design', url: 'coolors.co', description: 'Color palette generator' }],
      aiGenerated: true, department: designDept._id, createdBy: admin._id
    },
    {
      title: 'Wireframes - All Pages',
      description: 'Create low-fidelity wireframes for all 8 pages: Homepage, About, Services, Portfolio, Blog (list + detail), Contact, 404. Include mobile layouts.',
      project: project1._id, goal: goal2._id,
      status: 'done', type: 'design', priority: 'high',
      assignees: [designer._id], reporter: pm._id,
      startDate: new Date('2026-01-28'), dueDate: new Date('2026-02-02'), completedAt: new Date('2026-02-01'),
      estimatedHours: 32, actualHours: 30, position: 6,
      subtasks: [{ title: 'Homepage wireframe', status: 'done' }, { title: 'About & Services wireframes', status: 'done' }, { title: 'Blog & Contact wireframes', status: 'done' }, { title: 'Mobile responsive layouts', status: 'done' }],
      tools: [{ name: 'Figma', category: 'design', url: 'figma.com', description: 'Wireframing tool' }],
      aiGenerated: true, department: designDept._id, createdBy: admin._id
    },
    {
      title: 'High-Fidelity Mockups & Interactive Prototype',
      description: 'Transform wireframes into pixel-perfect high-fidelity designs. Create clickable prototype for stakeholder review and developer handoff.',
      project: project1._id, goal: goal2._id,
      status: 'done', type: 'design', priority: 'critical',
      assignees: [designer._id], reporter: pm._id,
      startDate: new Date('2026-02-02'), dueDate: new Date('2026-02-07'), completedAt: new Date('2026-02-07'),
      estimatedHours: 40, actualHours: 42, position: 7,
      subtasks: [{ title: 'Desktop designs (all pages)', status: 'done' }, { title: 'Mobile designs (all pages)', status: 'done' }, { title: 'Interactive prototype in Figma', status: 'done' }, { title: 'Design review meeting & approval', status: 'done' }],
      tools: [{ name: 'Figma', category: 'design', url: 'figma.com', description: 'High-fidelity design' }, { name: 'Zeplin', category: 'design', url: 'zeplin.io', description: 'Design handoff to developers' }],
      aiGenerated: true, department: designDept._id, createdBy: admin._id
    }
  ]);

  // ─── TASKS - GOAL 3: Frontend Development ─────────────
  const tasks_g3 = await Task.insertMany([
    {
      title: 'React Project Scaffolding & Base Components',
      description: 'Initialize React project with Vite, configure routing, set up global styles, create base layout components and design system components.',
      project: project1._id, goal: goal3._id,
      status: 'done', type: 'feature', priority: 'critical',
      assignees: [frontend._id], reporter: pm._id,
      startDate: new Date('2026-02-08'), dueDate: new Date('2026-02-12'), completedAt: new Date('2026-02-11'),
      estimatedHours: 16, actualHours: 14, position: 8,
      subtasks: [{ title: 'Initialize Vite React project', status: 'done' }, { title: 'Configure React Router', status: 'done' }, { title: 'Set up global CSS and Tailwind', status: 'done' }, { title: 'Create base Layout component', status: 'done' }],
      tools: [{ name: 'React', category: 'development', url: 'react.dev', description: 'Frontend framework' }, { name: 'Vite', category: 'development', url: 'vitejs.dev', description: 'Build tool' }, { name: 'Tailwind CSS', category: 'development', url: 'tailwindcss.com', description: 'Utility-first CSS' }],
      aiGenerated: true, department: devDept._id, createdBy: admin._id
    },
    {
      title: 'Homepage Development',
      description: 'Build the homepage with hero section, features grid, client logos, testimonials carousel, stats counter, and CTA section with animations.',
      project: project1._id, goal: goal3._id,
      status: 'in_progress', type: 'feature', priority: 'high',
      assignees: [frontend._id], reporter: pm._id,
      startDate: new Date('2026-02-12'), dueDate: new Date('2026-02-18'),
      estimatedHours: 24, actualHours: 12, position: 9,
      subtasks: [{ title: 'Hero section with animation', status: 'done' }, { title: 'Features grid section', status: 'in_progress' }, { title: 'Testimonials carousel', status: 'pending' }, { title: 'Stats counter and CTA', status: 'pending' }],
      tools: [{ name: 'Framer Motion', category: 'development', url: 'framer.com/motion', description: 'React animation library' }],
      aiGenerated: true, department: devDept._id, createdBy: admin._id
    },
    {
      title: 'Inner Pages Development',
      description: 'Develop About, Services, Portfolio, Blog list, Blog detail, and Contact pages following approved Figma designs.',
      project: project1._id, goal: goal3._id,
      status: 'planned', type: 'feature', priority: 'high',
      assignees: [frontend._id], reporter: pm._id,
      startDate: new Date('2026-02-18'), dueDate: new Date('2026-02-25'),
      estimatedHours: 40, position: 10,
      subtasks: [{ title: 'About page', status: 'pending' }, { title: 'Services page', status: 'pending' }, { title: 'Blog list & detail pages', status: 'pending' }, { title: 'Contact page with form', status: 'pending' }],
      tools: [],
      aiGenerated: true, department: devDept._id, createdBy: admin._id
    },
    {
      title: 'Responsive Design & Performance Optimization',
      description: 'Ensure all pages are fully responsive on mobile/tablet. Optimize images, implement lazy loading, code splitting, and achieve 90+ Lighthouse score.',
      project: project1._id, goal: goal3._id,
      status: 'planned', type: 'feature', priority: 'high',
      assignees: [frontend._id], reporter: pm._id,
      startDate: new Date('2026-02-23'), dueDate: new Date('2026-02-28'),
      estimatedHours: 16, position: 11,
      subtasks: [{ title: 'Mobile responsive fixes', status: 'pending' }, { title: 'Image optimization & lazy loading', status: 'pending' }, { title: 'Code splitting', status: 'pending' }],
      tools: [{ name: 'Lighthouse', category: 'testing', url: 'developers.google.com/web/tools/lighthouse', description: 'Performance auditing' }],
      aiGenerated: true, department: devDept._id, createdBy: admin._id
    }
  ]);

  // ─── TASKS - GOAL 4: Backend & CMS ────────────────────
  const tasks_g4 = await Task.insertMany([
    {
      title: 'Database Setup & Environment Configuration',
      description: 'Set up MongoDB Atlas production cluster, configure environment variables, implement connection pooling and basic security hardening.',
      project: project1._id, goal: goal4._id,
      status: 'done', type: 'feature', priority: 'critical',
      assignees: [backend._id], reporter: pm._id,
      startDate: new Date('2026-02-08'), dueDate: new Date('2026-02-10'), completedAt: new Date('2026-02-10'),
      estimatedHours: 4, actualHours: 3, position: 12,
      subtasks: [{ title: 'Set up MongoDB Atlas cluster', status: 'done' }, { title: 'Configure environment variables', status: 'done' }, { title: 'Security hardening', status: 'done' }],
      tools: [{ name: 'MongoDB Atlas', category: 'development', url: 'mongodb.com/atlas', description: 'Cloud database' }],
      aiGenerated: true, department: devDept._id, createdBy: admin._id
    },
    {
      title: 'Headless CMS Setup & Content Modeling',
      description: 'Install and configure Strapi CMS. Define content types for pages, blog posts, services, and team members. Set up media library.',
      project: project1._id, goal: goal4._id,
      status: 'in_progress', type: 'feature', priority: 'high',
      assignees: [backend._id], reporter: pm._id,
      startDate: new Date('2026-02-14'), dueDate: new Date('2026-02-20'),
      estimatedHours: 20, actualHours: 8, position: 13,
      subtasks: [{ title: 'Install Strapi', status: 'done' }, { title: 'Define content types', status: 'in_progress' }, { title: 'Media library setup', status: 'pending' }, { title: 'API permissions configuration', status: 'pending' }],
      tools: [{ name: 'Strapi', category: 'development', url: 'strapi.io', description: 'Open-source headless CMS' }],
      aiGenerated: true, department: devDept._id, createdBy: admin._id
    },
    {
      title: 'Contact Form API & Email Integration',
      description: 'Build contact form REST API endpoint with validation, spam protection (reCAPTCHA), and transactional email via SendGrid.',
      project: project1._id, goal: goal4._id,
      status: 'planned', type: 'feature', priority: 'medium',
      assignees: [backend._id], reporter: pm._id,
      startDate: new Date('2026-02-20'), dueDate: new Date('2026-02-25'),
      estimatedHours: 12, position: 14,
      subtasks: [{ title: 'Build contact form endpoint', status: 'pending' }, { title: 'Add reCAPTCHA protection', status: 'pending' }, { title: 'Integrate SendGrid email', status: 'pending' }],
      tools: [{ name: 'SendGrid', category: 'other', url: 'sendgrid.com', description: 'Transactional email service' }],
      aiGenerated: true, department: devDept._id, createdBy: admin._id
    }
  ]);

  // ─── TASKS - GOAL 5: Content Creation ─────────────────
  const tasks_g5 = await Task.insertMany([
    {
      title: 'Homepage & Key Pages Copywriting',
      description: 'Write compelling, SEO-optimized copy for homepage hero, about page, and all service pages. Align with brand voice guidelines.',
      project: project1._id, goal: goal5._id,
      status: 'planned', type: 'content', priority: 'high',
      assignees: [writer._id], reporter: pm._id,
      startDate: new Date('2026-02-22'), dueDate: new Date('2026-03-01'),
      estimatedHours: 20, position: 15,
      subtasks: [{ title: 'Homepage hero copy', status: 'pending' }, { title: 'About page copy', status: 'pending' }, { title: 'Services descriptions (all 6)', status: 'pending' }],
      tools: [{ name: 'Grammarly', category: 'other', url: 'grammarly.com', description: 'Writing assistant' }, { name: 'Hemingway Editor', category: 'other', url: 'hemingwayapp.com', description: 'Readability checker' }],
      aiGenerated: true, department: marketDept._id, createdBy: admin._id
    },
    {
      title: 'Blog Articles Creation (5 posts)',
      description: 'Write 5 SEO-optimized blog articles (1200+ words each) targeting primary keywords. Include meta descriptions and header optimization.',
      project: project1._id, goal: goal5._id,
      status: 'planned', type: 'content', priority: 'medium',
      assignees: [writer._id], reporter: marketer._id,
      startDate: new Date('2026-02-25'), dueDate: new Date('2026-03-05'),
      estimatedHours: 30, position: 16,
      subtasks: [{ title: 'Article 1: Industry trends', status: 'pending' }, { title: 'Article 2: How-to guide', status: 'pending' }, { title: 'Article 3: Case study', status: 'pending' }, { title: 'Articles 4 & 5', status: 'pending' }],
      tools: [{ name: 'Surfer SEO', category: 'analytics', url: 'surferseo.com', description: 'SEO content optimization' }],
      aiGenerated: true, department: marketDept._id, createdBy: admin._id
    },
    {
      title: 'Image Sourcing, Selection & Optimization',
      description: 'Source high-quality images from Unsplash/Shutterstock. Optimize all images for web (WebP format, compression). Create custom graphics where needed.',
      project: project1._id, goal: goal5._id,
      status: 'planned', type: 'content', priority: 'medium',
      assignees: [designer._id], reporter: pm._id,
      startDate: new Date('2026-02-25'), dueDate: new Date('2026-03-03'),
      estimatedHours: 10, position: 17,
      subtasks: [{ title: 'Source and license images', status: 'pending' }, { title: 'Convert to WebP and optimize', status: 'pending' }, { title: 'Create custom illustrations', status: 'pending' }],
      tools: [{ name: 'Unsplash', category: 'design', url: 'unsplash.com', description: 'Free high-quality images' }, { name: 'TinyPNG', category: 'development', url: 'tinypng.com', description: 'Image compression' }],
      aiGenerated: true, department: designDept._id, createdBy: admin._id
    }
  ]);

  // ─── TASKS - GOAL 6: Testing, Launch & SEO ────────────
  const tasks_g6 = await Task.insertMany([
    {
      title: 'Cross-Browser & Device Testing',
      description: 'Comprehensive testing on Chrome, Firefox, Safari, Edge. Mobile testing on iOS and Android. Document and fix all issues found.',
      project: project1._id, goal: goal6._id,
      status: 'planned', type: 'testing', priority: 'critical',
      assignees: [qa._id], reporter: pm._id,
      startDate: new Date('2026-03-04'), dueDate: new Date('2026-03-09'),
      estimatedHours: 24, position: 18,
      subtasks: [{ title: 'Chrome & Firefox testing', status: 'pending' }, { title: 'Safari & Edge testing', status: 'pending' }, { title: 'iOS & Android testing', status: 'pending' }, { title: 'Accessibility audit (WCAG 2.1)', status: 'pending' }],
      tools: [{ name: 'BrowserStack', category: 'testing', url: 'browserstack.com', description: 'Cross-browser cloud testing' }, { name: 'Cypress', category: 'testing', url: 'cypress.io', description: 'E2E test automation' }],
      aiGenerated: true, department: qaDept._id, createdBy: admin._id
    },
    {
      title: 'SEO Implementation & Technical Optimization',
      description: 'Implement on-page SEO: meta tags, OG tags, XML sitemap, robots.txt, schema markup, canonical URLs, and Core Web Vitals optimization.',
      project: project1._id, goal: goal6._id,
      status: 'planned', type: 'feature', priority: 'high',
      assignees: [marketer._id], reporter: pm._id,
      startDate: new Date('2026-03-04'), dueDate: new Date('2026-03-10'),
      estimatedHours: 16, position: 19,
      subtasks: [{ title: 'Meta tags and OG tags', status: 'pending' }, { title: 'XML sitemap and robots.txt', status: 'pending' }, { title: 'Schema markup (JSON-LD)', status: 'pending' }, { title: 'Core Web Vitals optimization', status: 'pending' }],
      tools: [{ name: 'Google Search Console', category: 'analytics', url: 'search.google.com/search-console', description: 'SEO monitoring' }, { name: 'Ahrefs', category: 'analytics', url: 'ahrefs.com', description: 'SEO analysis and keyword research' }],
      aiGenerated: true, department: marketDept._id, createdBy: admin._id
    },
    {
      title: 'Security Audit & Performance Hardening',
      description: 'Run security vulnerability scan, implement security headers (CSP, HSTS), SSL configuration, and ensure 90+ Lighthouse score on all pages.',
      project: project1._id, goal: goal6._id,
      status: 'planned', type: 'testing', priority: 'high',
      assignees: [backend._id], reporter: pm._id,
      startDate: new Date('2026-03-08'), dueDate: new Date('2026-03-11'),
      estimatedHours: 10, position: 20,
      subtasks: [{ title: 'Security vulnerability scan', status: 'pending' }, { title: 'HTTP security headers', status: 'pending' }, { title: 'SSL/HTTPS configuration', status: 'pending' }],
      tools: [{ name: 'OWASP ZAP', category: 'testing', url: 'zaproxy.org', description: 'Security scanning' }, { name: 'SSL Labs', category: 'testing', url: 'ssllabs.com', description: 'SSL configuration checker' }],
      aiGenerated: true, department: devDept._id, createdBy: admin._id
    },
    {
      title: 'Production Deployment & Go-Live',
      description: 'Deploy to Vercel, configure custom domain and DNS, set up CDN, connect Google Analytics, and perform final smoke test.',
      project: project1._id, goal: goal6._id,
      status: 'planned', type: 'deployment', priority: 'critical',
      assignees: [frontend._id, backend._id], reporter: pm._id,
      startDate: new Date('2026-03-12'), dueDate: new Date('2026-03-15'),
      estimatedHours: 8, position: 21,
      subtasks: [{ title: 'Deploy to Vercel production', status: 'pending' }, { title: 'Configure custom domain & DNS', status: 'pending' }, { title: 'Connect Google Analytics & GSC', status: 'pending' }, { title: 'Final smoke test', status: 'pending' }, { title: 'Launch announcement', status: 'pending' }],
      tools: [{ name: 'Vercel', category: 'development', url: 'vercel.com', description: 'Frontend hosting platform' }, { name: 'Cloudflare', category: 'development', url: 'cloudflare.com', description: 'CDN and DNS management' }, { name: 'Google Analytics 4', category: 'analytics', url: 'analytics.google.com', description: 'Web analytics' }],
      aiGenerated: true, department: devDept._id, createdBy: admin._id
    }
  ]);

  // Update project progress
  const allTasks = [...tasks_g1, ...tasks_g2, ...tasks_g3, ...tasks_g4, ...tasks_g5, ...tasks_g6];
  const doneTasks = allTasks.filter(t => t.status === 'done').length;
  await Project.findByIdAndUpdate(project1._id, {
    'progress.percentage': Math.round((doneTasks / allTasks.length) * 100),
    'progress.completedTasks': doneTasks,
    'progress.totalTasks': allTasks.length
  });

  console.log(`Created ${allTasks.length} tasks across 6 goals`);

  // ─── PROJECT 2: Mobile App MVP ────────────────────────
  const project2 = await Project.create({
    name: 'Mobile App MVP',
    description: 'Customer-facing mobile app (iOS/Android) for product ordering, order tracking, and loyalty program.',
    organization: org._id,
    industry: 'technology',
    status: 'planning',
    priority: 'medium',
    startDate: new Date('2026-02-01'),
    endDate: new Date('2026-05-01'),
    team: [{ user: admin._id, role: 'owner' }, { user: frontend._id, role: 'manager' }, { user: backend._id, role: 'member' }, { user: designer._id, role: 'member' }],
    color: '#10B981',
    createdBy: admin._id,
    'progress.totalTasks': 0
  });

  await Task.insertMany([
    { title: 'App Architecture & Tech Stack Decision', description: 'Evaluate React Native vs Flutter. Define state management, navigation, and backend integration strategy.', project: project2._id, status: 'in_progress', type: 'planning', priority: 'critical', assignees: [frontend._id], estimatedHours: 8, dueDate: new Date('2026-02-10'), position: 1, createdBy: admin._id },
    { title: 'UI Kit & Design System', description: 'Create mobile-first design system with components for both iOS and Android conventions.', project: project2._id, status: 'planned', type: 'design', priority: 'high', assignees: [designer._id], estimatedHours: 30, dueDate: new Date('2026-02-20'), position: 2, tools: [{ name: 'Figma', category: 'design', url: 'figma.com', description: 'Mobile UI design' }], createdBy: admin._id },
    { title: 'User Authentication Module', description: 'Implement JWT-based auth with social login (Google/Apple), biometric authentication, and refresh token rotation.', project: project2._id, status: 'planned', type: 'feature', priority: 'critical', assignees: [backend._id], estimatedHours: 24, dueDate: new Date('2026-03-01'), position: 3, createdBy: admin._id },
    { title: 'Product Catalog & Search', description: 'Build product listing, search with filters, product detail view, and image gallery.', project: project2._id, status: 'planned', type: 'feature', priority: 'high', assignees: [frontend._id], estimatedHours: 32, dueDate: new Date('2026-03-15'), position: 4, createdBy: admin._id }
  ]);

  await Project.findByIdAndUpdate(project2._id, { 'progress.totalTasks': 4 });

  // ─── Activity Logs ────────────────────────────────────
  await ActivityLog.insertMany([
    { organization: org._id, user: admin._id, userName: 'Alex Admin', action: 'ai_generated', entityType: 'project', entityId: project1._id, entityName: 'TechCorp Company Website', metadata: { prompt: 'Build a company website' }, timestamp: new Date('2026-01-10') },
    { organization: org._id, user: pm._id, userName: 'Patricia Manager', action: 'completed', entityType: 'task', entityId: tasks_g1[0]._id, entityName: 'Stakeholder Requirements Workshop', timestamp: new Date('2026-01-17') },
    { organization: org._id, user: designer._id, userName: 'Diana Designer', action: 'completed', entityType: 'goal', entityId: goal2._id, entityName: 'UI/UX Design', timestamp: new Date('2026-02-07') },
    { organization: org._id, user: frontend._id, userName: 'Frank Frontend', action: 'status_changed', entityType: 'task', entityId: tasks_g3[1]._id, entityName: 'Homepage Development', changes: { before: { status: 'planned' }, after: { status: 'in_progress' } }, timestamp: new Date('2026-02-12') },
    { organization: org._id, user: admin._id, userName: 'Alex Admin', action: 'created', entityType: 'project', entityId: project2._id, entityName: 'Mobile App MVP', timestamp: new Date('2026-02-01') },
    { organization: org._id, user: pm._id, userName: 'Patricia Manager', action: 'assigned', entityType: 'task', entityId: tasks_g4[1]._id, entityName: 'Headless CMS Setup', metadata: { assignee: 'Ben Backend' }, timestamp: new Date('2026-02-14') }
  ]);

  console.log('Created activity logs');
  console.log('\n✅ Seed completed successfully!');
  console.log('\n📋 Login credentials:');
  console.log('  Admin:    admin@techcorp.com / password123');
  console.log('  Manager:  pm@techcorp.com / password123');
  console.log('  Designer: designer@techcorp.com / password123');
  console.log('  Dev:      frontend@techcorp.com / password123');
  console.log('\n🌐 Backend: http://localhost:5000');
  console.log('🎨 Frontend: http://localhost:3000');

  await mongoose.disconnect();
}

seed().catch(err => { console.error('Seed failed:', err); process.exit(1); });
