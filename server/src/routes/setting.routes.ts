import { Router } from 'express';
import { settingController } from '../controllers/setting.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/role.middleware';

const router = Router();

// Public / Authenticated read settings
router.get('/', (req, res) => settingController.getSettings(req, res));

// Admin-only management
router.put('/', authenticateJWT, authorizeRoles('ADMINISTRATOR'), (req, res) => settingController.updateSettings(req, res));
router.get('/backup', authenticateJWT, authorizeRoles('ADMINISTRATOR'), (req, res) => settingController.exportBackup(req, res));
router.post('/reset-demo', authenticateJWT, authorizeRoles('ADMINISTRATOR'), (req, res) => settingController.resetDemoData(req, res));

export default router;
