import { Router } from 'express';
import { protect } from '../middleware/auth.middleware.js';
import {
  getSprints,
  createSprint,
  getSprint,
  updateSprint,
  deleteSprint,
  addTaskToSprint,
  removeTaskFromSprint,
  getSprintBurndown
} from '../controllers/sprint.controller.js';

const router = Router();

router.use(protect);

router.get('/', getSprints);
router.post('/', createSprint);
router.get('/:id', getSprint);
router.put('/:id', updateSprint);
router.delete('/:id', deleteSprint);
router.post('/:id/tasks', addTaskToSprint);
router.delete('/:id/tasks/:taskId', removeTaskFromSprint);
router.get('/:id/burndown', getSprintBurndown);

export default router;
