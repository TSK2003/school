import { Router } from 'express';
import {
  getDropdownOptions,
  getStudentsByStandardAndSection,
  getStudents,
  getStudentById,
  createStudent
} from './studentController.js';

const router = Router();

router.get('/metadata/options', getDropdownOptions);
router.get('/lookup', getStudentsByStandardAndSection);
router.get('/', getStudents);
router.post('/', createStudent);
router.get('/:id', getStudentById);

export default router;
