import { Router } from 'express';
import { classroomController } from '../controllers/classroom.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/role.middleware';

const router = Router();

router.use(authenticateJWT);

router.get('/', (req, res) => classroomController.getAll(req, res));
router.get('/:id', (req, res) => classroomController.getById(req, res));
router.post('/', authorizeRoles('ADMINISTRATOR'), (req, res) => classroomController.create(req, res));
router.put('/:id', authorizeRoles('ADMINISTRATOR'), (req, res) => classroomController.update(req, res));
router.delete('/:id', authorizeRoles('ADMINISTRATOR'), (req, res) => classroomController.delete(req, res));

export default router;
