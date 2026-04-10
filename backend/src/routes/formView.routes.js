import express from 'express';
import { getForms, createForm, updateForm, deleteForm, getPublicForm, submitForm } from '../controllers/formView.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();
// Public routes (no auth)
router.get('/public/:token', getPublicForm);
router.post('/public/:token', submitForm);
// Protected routes
router.use(protect);
router.get('/', getForms);
router.post('/', createForm);
router.put('/:id', updateForm);
router.delete('/:id', deleteForm);
export default router;
