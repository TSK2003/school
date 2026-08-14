import { Router } from 'express';
import { getDashboardStats } from './dashboardController.js';
import { requireAuth } from '../../middleware/authMiddleware.js';

const router = Router();

router.get('/stats', requireAuth, getDashboardStats);

export default router;
