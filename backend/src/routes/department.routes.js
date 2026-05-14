import { Router } from 'express';
import { getDepartments, getDepartment, createDepartment, updateDepartment, deleteDepartment } from '../controllers/department.controller.js';
import { protect, requirePermission } from '../middleware/auth.middleware.js';

const router = Router();
router.use(protect);

router.get('/', getDepartments);
router.post('/', requirePermission('departments', 'create'), createDepartment);
router.get('/:id', getDepartment);
router.put('/:id', requirePermission('departments', 'update'), updateDepartment);
router.delete('/:id', requirePermission('departments', 'delete'), deleteDepartment);

export default router;
