import { Router } from 'express';
import { examController } from '../controllers/exam.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/role.middleware';

const router = Router();

router.use(authenticateJWT);

router.get('/', authorizeRoles('ADMINISTRATOR', 'TEACHER', 'STUDENT'), (req, res) => examController.getAll(req, res));
router.get('/:id', authorizeRoles('ADMINISTRATOR', 'TEACHER', 'STUDENT'), (req, res) => examController.getById(req, res));
router.post('/', authorizeRoles('ADMINISTRATOR', 'TEACHER'), (req, res) => examController.create(req, res));
router.put('/:id', authorizeRoles('ADMINISTRATOR', 'TEACHER'), (req, res) => examController.update(req, res));
router.delete('/:id', authorizeRoles('ADMINISTRATOR', 'TEACHER'), (req, res) => examController.delete(req, res));

export default router;
