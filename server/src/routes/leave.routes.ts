import { Router } from 'express';
import { leaveController } from '../controllers/leave.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/role.middleware';

const router = Router();

router.use(authenticateJWT);

router.get('/', (req, res) => leaveController.getAll(req, res));
router.post('/apply', authorizeRoles('STUDENT', 'TEACHER', 'ADMINISTRATOR'), (req, res) =>
  leaveController.apply(req, res)
);
router.patch('/:id/status', authorizeRoles('ADMINISTRATOR', 'TEACHER'), (req, res) =>
  leaveController.updateStatus(req, res)
);

export default router;
