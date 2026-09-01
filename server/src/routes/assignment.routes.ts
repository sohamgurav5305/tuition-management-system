import { Router } from 'express';
import { assignmentController } from '../controllers/assignment.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/role.middleware';
import { uploadSingle } from '../middleware/upload.middleware';

const router = Router();

router.use(authenticateJWT);

// Student Assignment Portal
router.get('/my-assignments', authorizeRoles('STUDENT', 'ADMINISTRATOR'), (req, res) => assignmentController.getMyAssignments(req, res));

// Assignment Management
router.get('/', authorizeRoles('ADMINISTRATOR', 'TEACHER', 'STUDENT'), (req, res) => assignmentController.getAll(req, res));
router.get('/:id', authorizeRoles('ADMINISTRATOR', 'TEACHER', 'STUDENT'), (req, res) => assignmentController.getById(req, res));
router.post('/', authorizeRoles('ADMINISTRATOR', 'TEACHER'), uploadSingle('attachment'), (req, res) => assignmentController.create(req, res));
router.put('/:id', authorizeRoles('ADMINISTRATOR', 'TEACHER'), uploadSingle('attachment'), (req, res) => assignmentController.update(req, res));
router.delete('/:id', authorizeRoles('ADMINISTRATOR', 'TEACHER'), (req, res) => assignmentController.delete(req, res));

// Submissions & Grading
router.post('/:id/submit', authorizeRoles('STUDENT'), uploadSingle('file'), (req, res) => assignmentController.submitAssignment(req, res));
router.get('/:id/submissions', authorizeRoles('ADMINISTRATOR', 'TEACHER', 'STUDENT'), (req, res) => assignmentController.getSubmissions(req, res));
router.post('/submissions/:submissionId/grade', authorizeRoles('ADMINISTRATOR', 'TEACHER'), (req, res) => assignmentController.gradeSubmission(req, res));

export default router;
