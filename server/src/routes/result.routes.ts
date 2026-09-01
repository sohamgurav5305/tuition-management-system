import { Router } from 'express';
import { resultController } from '../controllers/result.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/role.middleware';

const router = Router();

router.use(authenticateJWT);

router.get('/my-results', authorizeRoles('STUDENT', 'ADMINISTRATOR'), (req, res) => resultController.getMyResults(req, res));
router.get('/exam/:examId', authorizeRoles('ADMINISTRATOR', 'TEACHER'), (req, res) => resultController.getByExam(req, res));
router.get('/student/:studentId', authorizeRoles('ADMINISTRATOR', 'TEACHER', 'STUDENT', 'ACCOUNTANT', 'RECEPTIONIST'), (req, res) => resultController.getByStudent(req, res));
router.post('/submit', authorizeRoles('ADMINISTRATOR', 'TEACHER'), (req, res) => resultController.submitResults(req, res));

export default router;
