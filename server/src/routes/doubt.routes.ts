import { Router } from 'express';
import { doubtController } from '../controllers/doubt.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/role.middleware';
import { uploadAny } from '../middleware/upload.middleware';

const router = Router();

router.use(authenticateJWT);

router.get('/batch-faculty', (req, res) => doubtController.getBatchFaculty(req, res));
router.get('/', (req, res) => doubtController.getAll(req, res));
router.get('/:id', (req, res) => doubtController.getById(req, res));
router.post('/', authorizeRoles('STUDENT', 'ADMINISTRATOR'), uploadAny(), (req, res) =>
  doubtController.create(req, res)
);
router.post('/:id/answer', authorizeRoles('TEACHER', 'ADMINISTRATOR'), uploadAny(), (req, res) =>
  doubtController.answer(req, res)
);
router.delete('/:id', authorizeRoles('ADMINISTRATOR', 'STUDENT'), (req, res) =>
  doubtController.delete(req, res)
);

export default router;
