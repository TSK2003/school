import { Router } from 'express';
import {
  submitApplication,
  getPendingApplications,
  getApplications,
  getApplicationById
} from './applicationController.js';

const router = Router();

router.post('/submit', submitApplication);
router.get('/pending', getPendingApplications);
router.get('/', getApplications);
router.get('/:id', getApplicationById);

export default router;
