import { Router } from 'express';
import { getTasks, createTask, getTask, updateTask, deleteTask, updateTaskStatus, addComment, addSubtask, updateSubtask, reorderTasks } from '../controllers/task.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();
router.use(protect);

router.put('/reorder', reorderTasks);
router.get('/', getTasks);
router.post('/', createTask);
router.get('/:id', getTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);
router.patch('/:id/status', updateTaskStatus);
router.post('/:id/comments', addComment);
router.post('/:id/subtasks', addSubtask);
router.put('/:taskId/subtasks/:subtaskId', updateSubtask);

export default router;
