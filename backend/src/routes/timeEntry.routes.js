import { Router } from 'express';
import { protect } from '../middleware/auth.middleware.js';
import {
  getTimeEntries,
  createTimeEntry,
  updateTimeEntry,
  deleteTimeEntry,
  getMyTimeReport
} from '../controllers/timeEntry.controller.js';

const router = Router();

router.use(protect);

router.get('/my-report', getMyTimeReport);
router.get('/', getTimeEntries);
router.post('/', createTimeEntry);
router.put('/:id', updateTimeEntry);
router.delete('/:id', deleteTimeEntry);

export default router;
