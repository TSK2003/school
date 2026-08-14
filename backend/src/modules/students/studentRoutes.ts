import { Router } from 'express';
import {
  getDropdownOptions,
  getStudentsByStandardAndSection,
  getStudents,
  getStudentById,
  createStudent,
  deleteStudent
} from './studentController.js';

const router = Router();

router.get('/metadata/options', getDropdownOptions);
router.get('/lookup', getStudentsByStandardAndSection);
router.get('/', getStudents);
router.post('/', createStudent);
router.get('/:id', getStudentById);
router.delete('/:id', deleteStudent);

export default router;
