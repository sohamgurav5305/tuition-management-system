import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

router.post('/login', (req, res) => authController.login(req, res));
router.get('/profile', authenticateJWT, (req, res) => authController.getProfile(req, res));
router.post('/change-password', authenticateJWT, (req, res) => authController.changePassword(req, res));

export default router;
