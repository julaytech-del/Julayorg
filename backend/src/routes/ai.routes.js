import { Router } from 'express';
import { generatePlan, assignTeamToProject, getStandup, getPerformanceAnalysis, replanProject } from '../controllers/ai.controller.js';
import { protect, requireSubscription, requirePermission } from '../middleware/auth.middleware.js';

const router = Router();
router.use(protect);
router.use(requirePermission('ai', 'use'));

// Generate-plan is the "first try free" entry point: the free plan gets a
// metered quota (planLimits.free.aiRequests = 1) enforced inside the controller
// via checkAndIncrementAI. Do NOT gate it behind requireSubscription, or new
// users never get their free trial of the core AI feature.
router.post('/generate-plan', generatePlan);

// Advanced AI features remain paid-only.
router.post('/assign-team/:projectId', requireSubscription, assignTeamToProject);
router.get('/standup/:projectId', requireSubscription, getStandup);
router.get('/performance/:projectId', requireSubscription, getPerformanceAnalysis);
router.post('/replan/:projectId', requireSubscription, replanProject);

export default router;
