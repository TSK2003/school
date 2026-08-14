import { Router } from 'express';
import { approveApplication, rejectApplication } from './verificationController.js';
import { requireAuth } from '../../middleware/authMiddleware.js';

const router = Router();

router.post('/:id/approve', requireAuth, approveApplication);
router.post('/:id/reject', requireAuth, rejectApplication);

export default router;
