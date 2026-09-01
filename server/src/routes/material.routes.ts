import { Router } from 'express';
import { materialController } from '../controllers/material.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/role.middleware';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

router.use(authenticateJWT);

router.get('/', (req, res) => materialController.getAll(req, res));
router.get('/:id', (req, res) => materialController.getById(req, res));
router.post('/', authorizeRoles('ADMINISTRATOR', 'TEACHER'), upload.single('file'), (req, res) => materialController.create(req, res));
router.delete('/:id', authorizeRoles('ADMINISTRATOR', 'TEACHER'), (req, res) => materialController.delete(req, res));
router.post('/:id/download', (req, res) => materialController.trackDownload(req, res));

export default router;
