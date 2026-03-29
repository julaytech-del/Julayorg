import { Router } from 'express';
import { generatePlan, assignTeamToProject, getStandup, getPerformanceAnalysis, replanProject } from '../controllers/ai.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();
router.use(protect);

router.post('/generate-plan', generatePlan);
router.post('/assign-team/:projectId', assignTeamToProject);
router.get('/standup/:projectId', getStandup);
router.get('/performance/:projectId', getPerformanceAnalysis);
router.post('/replan/:projectId', replanProject);

export default router;
