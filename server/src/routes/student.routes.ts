import { Router } from 'express';
import { studentController } from '../controllers/student.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/role.middleware';
import { uploadSingle } from '../middleware/upload.middleware';

const router = Router();

router.use(authenticateJWT);

router.get('/my-profile', authorizeRoles('STUDENT', 'ADMINISTRATOR'), (req, res) => studentController.getMyProfile(req, res));
router.get('/', authorizeRoles('ADMINISTRATOR', 'ACCOUNTANT', 'TEACHER'), (req, res) => studentController.getAll(req, res));
router.get('/:id', authorizeRoles('ADMINISTRATOR', 'ACCOUNTANT', 'TEACHER', 'STUDENT'), (req, res) => studentController.getById(req, res));
router.post('/', authorizeRoles('ADMINISTRATOR'), uploadSingle('avatar'), (req, res) => studentController.create(req, res));
router.put('/:id', authorizeRoles('ADMINISTRATOR'), uploadSingle('avatar'), (req, res) => studentController.update(req, res));
router.delete('/:id', authorizeRoles('ADMINISTRATOR'), (req, res) => studentController.delete(req, res));

export default router;
