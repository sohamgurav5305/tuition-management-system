import { Router } from 'express';
import { attendanceController } from '../controllers/attendance.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/role.middleware';

const router = Router();

router.use(authenticateJWT);

router.get('/my-attendance', authorizeRoles('STUDENT', 'ADMINISTRATOR'), (req, res) => attendanceController.getMyAttendance(req, res));
router.get('/institute-stats', authorizeRoles('ADMINISTRATOR'), (req, res) => attendanceController.getInstituteStats(req, res));
router.get('/range', authorizeRoles('ADMINISTRATOR', 'TEACHER', 'ACCOUNTANT'), (req, res) => attendanceController.getBatchAttendanceRange(req, res));
router.get('/batch/:batchId', authorizeRoles('ADMINISTRATOR', 'TEACHER', 'ACCOUNTANT'), (req, res) => attendanceController.getBatchAttendance(req, res));
router.get('/student/:studentId', authorizeRoles('ADMINISTRATOR', 'TEACHER', 'RECEPTIONIST'), (req, res) => attendanceController.getStudentAttendance(req, res));
router.post('/mark', authorizeRoles('ADMINISTRATOR', 'TEACHER'), (req, res) => attendanceController.markAttendance(req, res));

export default router;
