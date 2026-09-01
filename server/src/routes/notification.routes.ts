import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/role.middleware';

const router = Router();

router.use(authenticateJWT);

router.get('/', (req, res) => notificationController.getMyNotifications(req, res));
router.post('/', authorizeRoles('ADMINISTRATOR', 'TEACHER'), (req, res) => notificationController.create(req, res));
router.patch('/read-all', (req, res) => notificationController.markAllAsRead(req, res));
router.patch('/:id/read', (req, res) => notificationController.markAsRead(req, res));

export default router;
