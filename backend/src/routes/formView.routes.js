import express from 'express';
import { getForms, createForm, updateForm, deleteForm, getPublicForm, submitForm, getFormSubmissions, updateSubmissionStatus, convertSubmissionToTask, analyzeSubmissions } from '../controllers/formView.controller.js';
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
router.get('/:id/submissions', getFormSubmissions);
router.patch('/:id/submissions/:subId/status', updateSubmissionStatus);
router.post('/:id/submissions/:subId/convert', convertSubmissionToTask);
router.post('/:id/analyze', analyzeSubmissions);
export default router;
