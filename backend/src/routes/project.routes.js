import { Router } from 'express';
import { getProjects, createProject, getProject, updateProject, deleteProject, getProjectStats, getGoals, createGoal, updateGoal, deleteGoal } from '../controllers/project.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();
router.use(protect);

router.get('/', getProjects);
router.post('/', createProject);
router.get('/:id', getProject);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);
router.get('/:id/stats', getProjectStats);

router.get('/:id/goals', getGoals);
router.post('/:id/goals', createGoal);
router.put('/:id/goals/:goalId', updateGoal);
router.delete('/:id/goals/:goalId', deleteGoal);

export default router;
