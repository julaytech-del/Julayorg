import { Router } from 'express';
import { getProjects, createProject, getProject, updateProject, deleteProject, getProjectStats, getGoals, createGoal, updateGoal, deleteGoal } from '../controllers/project.controller.js';
import { protect, requirePermission } from '../middleware/auth.middleware.js';
import ganttRouter from './gantt.routes.js';

const router = Router();
router.use(protect);

router.get('/', getProjects);
router.post('/', requirePermission('projects', 'create'), createProject);
router.get('/:id', getProject);
router.put('/:id', requirePermission('projects', 'update'), updateProject);
router.delete('/:id', requirePermission('projects', 'delete'), deleteProject);
router.get('/:id/stats', getProjectStats);

router.use('/:id/gantt', ganttRouter);
router.get('/:id/goals', getGoals);
router.post('/:id/goals', requirePermission('projects', 'update'), createGoal);
router.put('/:id/goals/:goalId', requirePermission('projects', 'update'), updateGoal);
router.delete('/:id/goals/:goalId', requirePermission('projects', 'update'), deleteGoal);

export default router;
