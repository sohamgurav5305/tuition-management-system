import { Router } from 'express';
import { reportController } from '../controllers/report.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/role.middleware';

const router = Router();

router.use(authenticateJWT);

router.get('/dashboard-summary', authorizeRoles('ADMINISTRATOR', 'ACCOUNTANT', 'TEACHER', 'STUDENT'), (req, res) => reportController.getDashboardSummary(req, res));
router.get('/revenue', authorizeRoles('ADMINISTRATOR', 'ACCOUNTANT'), (req, res) => reportController.getRevenueReport(req, res));
router.get('/pending-fees', authorizeRoles('ADMINISTRATOR', 'ACCOUNTANT'), (req, res) => reportController.getPendingFeesReport(req, res));
router.get('/batch-strength', authorizeRoles('ADMINISTRATOR'), (req, res) => reportController.getBatchStrengthReport(req, res));
router.get('/course-revenue', authorizeRoles('ADMINISTRATOR', 'ACCOUNTANT'), (req, res) => reportController.getCourseRevenueReport(req, res));
router.get('/export/:type', authorizeRoles('ADMINISTRATOR', 'ACCOUNTANT'), (req, res) => reportController.exportCsv(req, res));

export default router;
