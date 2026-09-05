import { Router } from 'express';
import authRoutes from './auth.routes';
import studentRoutes from './student.routes';
import facultyRoutes from './faculty.routes';
import courseRoutes from './course.routes';
import batchRoutes from './batch.routes';
import attendanceRoutes from './attendance.routes';
import assignmentRoutes from './assignment.routes';
import paymentRoutes from './payment.routes';
import reportRoutes from './report.routes';
import notificationRoutes from './notification.routes';
import settingRoutes from './setting.routes';
import materialRoutes from './material.routes';
import doubtRoutes from './doubt.routes';
import leaveRoutes from './leave.routes';
import eventRoutes from './event.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/students', studentRoutes);
router.use('/faculty', facultyRoutes);
router.use('/courses', courseRoutes);
router.use('/batches', batchRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/assignments', assignmentRoutes);
router.use('/payments', paymentRoutes);
router.use('/reports', reportRoutes);
router.use('/notifications', notificationRoutes);
router.use('/settings', settingRoutes);
router.use('/materials', materialRoutes);
router.use('/doubts', doubtRoutes);
router.use('/leaves', leaveRoutes);
router.use('/events', eventRoutes);

export default router;
