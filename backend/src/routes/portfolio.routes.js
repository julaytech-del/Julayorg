import { Router } from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { getPortfolio } from '../controllers/portfolio.controller.js';

const router = Router();

router.use(protect);

router.get('/', getPortfolio);

export default router;
