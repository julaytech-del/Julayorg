import { Router } from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { analyzeContext, getSuggestions, applySuggestionItem, rejectSuggestionItem, getSuggestionsCount } from '../controllers/context.controller.js';

const router = Router();
router.use(protect);

router.post('/analyze', analyzeContext);
router.get('/suggestions', getSuggestions);
router.get('/suggestions/count', getSuggestionsCount);
router.post('/suggestions/:suggestionId/items/:itemIndex/apply', applySuggestionItem);
router.post('/suggestions/:suggestionId/items/:itemIndex/reject', rejectSuggestionItem);

export default router;
