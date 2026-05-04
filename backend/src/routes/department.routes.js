import { Router } from 'express';
import { getDepartments, getDepartment, createDepartment, updateDepartment, deleteDepartment } from '../controllers/department.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();
router.use(protect);

router.get('/', getDepartments);
router.post('/', createDepartment);
router.get('/:id', getDepartment);
router.put('/:id', updateDepartment);
router.delete('/:id', deleteDepartment);

export default router;
