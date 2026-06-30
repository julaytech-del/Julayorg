import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import authRoutes from './routes/auth.routes.js';
import projectRoutes from './routes/project.routes.js';
import taskRoutes from './routes/task.routes.js';
import userRoutes from './routes/user.routes.js';
import departmentRoutes from './routes/department.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import aiRoutes from './routes/ai.routes.js';
import subscriptionRoutes from './routes/subscription.routes.js';
import contextRoutes from './routes/context.routes.js';
import calendarRoutes from './routes/calendar.routes.js';
import workloadRoutes from './routes/workload.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import automationRoutes from './routes/automation.routes.js';
import webhookRoutes from './routes/webhook.routes.js';
import dashboardConfigRoutes from './routes/dashboardConfig.routes.js';
import reportsRoutes from './routes/reports.routes.js';
import formViewRoutes from './routes/formView.routes.js';
import sprintRoutes from './routes/sprint.routes.js';
import timeEntryRoutes from './routes/timeEntry.routes.js';
import activityLogRoutes from './routes/activityLog.routes.js';
import searchRoutes from './routes/search.routes.js';
import myTasksRoutes from './routes/myTasks.routes.js';
import portfolioRoutes from './routes/portfolio.routes.js';
import twoFactorRoutes from './routes/twoFactor.routes.js';
import integrationsRoutes from './routes/integrations.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import organizationRoutes from './routes/organization.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import contactRoutes from './routes/contact.routes.js';
import ownerAdminRoutes from './routes/ownerAdmin.routes.js';
import chatRoutes from './routes/chat.routes.js';
import whatsappApiRoutes from './routes/whatsappApi.routes.js';
import lemonsqueezyRoutes from './routes/lemonsqueezy.routes.js';
import { errorHandler, notFound, alertOn5xx } from './middleware/error.middleware.js';

const app = express();
app.set('trust proxy', 1);

const allowedOrigins = ['https://julay.org', 'https://www.julay.org', 'https://analytics.julay.org', 'http://localhost:3000', 'http://localhost:5173'];
app.use(cors({ origin: (origin, cb) => { if (!origin || allowedOrigins.includes(origin)) cb(null, true); else cb(null, false); }, credentials: true }));
app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use((req, res, next) => {
  if (req.path === '/api/lemonsqueezy/webhook') return next();
  express.json({ limit: '10mb' })(req, res, next);
});
app.use(express.urlencoded({ extended: true }));

// Global 5xx alerter — notifies owner (Telegram + email) on ANY server error
app.use(alertOn5xx);

const isTest = process.env.NODE_ENV === 'test';
// Strict limit for login/register/OTP (brute-force protection); skip /me which is called on every page load
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: isTest ? 10000 : 20, skip: req => req.path === '/me', message: { success: false, message: 'Too many attempts, please try again later.' } });
// Relaxed limit for /auth/me — checked on every React page mount, high limit prevents false logouts
const meLimiter   = rateLimit({ windowMs: 15 * 60 * 1000, max: isTest ? 10000 : 500, message: { success: false, message: 'Too many requests.' } });
// Async generation status polling (GET .../generate-plan/status/:jobId) fires every
// ~2s for the duration of one generation — it's a cheap in-memory lookup with no AI
// cost, so it must NOT count against the AI compute limit, or a single generation
// trips the limiter mid-run.
const aiLimiter   = rateLimit({ windowMs: 60 * 1000,      max: isTest ? 10000 : 20, skip: req => req.method === 'GET' && req.originalUrl.includes('/ai/generate-plan/status/'), message: { success: false, message: 'Too many AI requests, please slow down.' } });

app.get(['/health', '/api/health'], (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.get('/api/auth/me', meLimiter);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/dashboard-config', dashboardConfigRoutes);
app.use('/api/ai', aiLimiter, aiRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/context', aiLimiter, contextRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/workload', workloadRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/automations', automationRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/forms', formViewRoutes);
app.use('/api/sprints', sprintRoutes);
app.use('/api/time-entries', timeEntryRoutes);
app.use('/api/activity', activityLogRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/my-tasks', myTasksRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/2fa', twoFactorRoutes);
app.use('/api/integrations', integrationsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/organization', organizationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/owner', ownerAdminRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/whatsapp', whatsappApiRoutes);
app.use('/api/lemonsqueezy', lemonsqueezyRoutes);
const UPLOADS_SERVE_DIR = process.env.UPLOADS_DIR || path.join(__dirname, '../uploads');
app.use('/uploads', express.static(UPLOADS_SERVE_DIR));

app.use(notFound);
app.use(errorHandler);

export default app;
