import { Router } from 'express';
import { EventController } from '../controllers/event.controller';

const router = Router();

router.get('/stream', EventController.stream);

export default router;
