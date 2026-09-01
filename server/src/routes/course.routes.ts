import { Router } from 'express';
import { courseController } from '../controllers/course.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/role.middleware';

const router = Router();

router.use(authenticateJWT);

router.get('/', authorizeRoles('ADMINISTRATOR', 'ACCOUNTANT', 'TEACHER', 'STUDENT'), (req, res) => courseController.getAll(req, res));
router.get('/:id', authorizeRoles('ADMINISTRATOR', 'ACCOUNTANT', 'TEACHER', 'STUDENT'), (req, res) => courseController.getById(req, res));
router.post('/', authorizeRoles('ADMINISTRATOR'), (req, res) => courseController.create(req, res));
router.put('/:id', authorizeRoles('ADMINISTRATOR'), (req, res) => courseController.update(req, res));
router.delete('/:id', authorizeRoles('ADMINISTRATOR'), (req, res) => courseController.delete(req, res));

export default router;
