import { Router } from 'express';
import { upload } from '../../middleware/uploadMiddleware.js';
import {
  uploadDocument,
  analyzeDocument,
  previewDocument
} from './documentController.js';

const router = Router();

router.post('/upload', upload.single('file'), uploadDocument);
router.post('/:id/analyze', analyzeDocument);
router.get('/:id/preview', previewDocument);

export default router;
