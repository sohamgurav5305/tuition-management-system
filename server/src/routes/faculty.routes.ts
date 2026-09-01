import { Router } from 'express';
import { facultyController } from '../controllers/faculty.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/role.middleware';
import { uploadSingle } from '../middleware/upload.middleware';

const router = Router();

router.use(authenticateJWT);

router.get('/my-profile', authorizeRoles('TEACHER', 'ADMINISTRATOR'), (req, res) => facultyController.getMyProfile(req, res));
router.get('/', authorizeRoles('ADMINISTRATOR', 'TEACHER'), (req, res) => facultyController.getAll(req, res));
router.get('/:id', authorizeRoles('ADMINISTRATOR', 'TEACHER'), (req, res) => facultyController.getById(req, res));
router.post('/', authorizeRoles('ADMINISTRATOR'), uploadSingle('avatar'), (req, res) => facultyController.create(req, res));
router.put('/:id', authorizeRoles('ADMINISTRATOR'), uploadSingle('avatar'), (req, res) => facultyController.update(req, res));
router.delete('/:id', authorizeRoles('ADMINISTRATOR'), (req, res) => facultyController.delete(req, res));

export default router;
