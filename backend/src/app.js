import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.routes.js';
import projectRoutes from './routes/project.routes.js';
import taskRoutes from './routes/task.routes.js';
import userRoutes from './routes/user.routes.js';
import departmentRoutes from './routes/department.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import aiRoutes from './routes/ai.routes.js';
import subscriptionRoutes from './routes/subscription.routes.js';
import { errorHandler, notFound } from './middleware/error.middleware.js';

const app = express();

const allowedOrigins = ['https://julay.org', 'https://www.julay.org', 'http://localhost:3000', 'http://localhost:5173'];
app.use(cors({ origin: (origin, cb) => { if (!origin || allowedOrigins.includes(origin)) cb(null, true); else cb(new Error('Not allowed by CORS')); }, credentials: true }));
app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { success: false, message: 'Too many attempts, please try again later.' } });
const aiLimiter = rateLimit({ windowMs: 60 * 1000, max: 10, message: { success: false, message: 'Too many AI requests, please slow down.' } });
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ai', aiLimiter, aiRoutes);
app.use('/api/subscription', subscriptionRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
