import { Router } from 'express';
import { getTasks, createTask, getTask, updateTask, deleteTask, updateTaskStatus, getComments, addComment, addSubtask, updateSubtask, reorderTasks } from '../controllers/task.controller.js';
import { protect, requirePermission } from '../middleware/auth.middleware.js';

const router = Router();
router.use(protect);

router.put('/reorder', requirePermission('tasks', 'update'), reorderTasks);
router.get('/', getTasks);
router.post('/', requirePermission('tasks', 'create'), createTask);
router.get('/:id', getTask);
router.put('/:id', requirePermission('tasks', 'update'), updateTask);
router.delete('/:id', requirePermission('tasks', 'delete'), deleteTask);
router.patch('/:id/status', requirePermission('tasks', 'update'), updateTaskStatus);
router.get('/:id/comments', getComments);
router.post('/:id/comments', requirePermission('tasks', 'update'), addComment);
router.post('/:id/subtasks', requirePermission('tasks', 'update'), addSubtask);
router.put('/:taskId/subtasks/:subtaskId', requirePermission('tasks', 'update'), updateSubtask);

export default router;
