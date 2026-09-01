import { Router } from 'express';
import { batchController } from '../controllers/batch.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/role.middleware';

const router = Router();

router.use(authenticateJWT);

router.get('/timetable', authorizeRoles('ADMINISTRATOR', 'TEACHER', 'STUDENT'), (req, res) => batchController.getTimetable(req, res));
router.get('/', authorizeRoles('ADMINISTRATOR', 'TEACHER'), (req, res) => batchController.getAll(req, res));
router.get('/:id', authorizeRoles('ADMINISTRATOR', 'TEACHER', 'STUDENT'), (req, res) => batchController.getById(req, res));
router.post('/', authorizeRoles('ADMINISTRATOR'), (req, res) => batchController.create(req, res));
router.put('/:id', authorizeRoles('ADMINISTRATOR'), (req, res) => batchController.update(req, res));
router.delete('/:id', authorizeRoles('ADMINISTRATOR'), (req, res) => batchController.delete(req, res));

export default router;
