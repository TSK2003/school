import { Router } from 'express';
import { getSettings, updateSettings, testGeminiConnection } from './settingsController.js';
import { requireAuth } from '../../middleware/authMiddleware.js';

const router = Router();

router.get('/', requireAuth, getSettings);
router.put('/', requireAuth, updateSettings);
router.post('/test-connection', requireAuth, testGeminiConnection);

export default router;
