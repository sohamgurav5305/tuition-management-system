import { Router } from 'express';
import { paymentController } from '../controllers/payment.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/role.middleware';

const router = Router();

router.use(authenticateJWT);

router.get('/my-fees', authorizeRoles('STUDENT', 'ADMINISTRATOR'), (req, res) => paymentController.getMyFees(req, res));
router.get('/receipt/:receiptId', authorizeRoles('ADMINISTRATOR', 'ACCOUNTANT', 'STUDENT'), (req, res) => paymentController.getByReceiptId(req, res));
router.get('/student/:studentId', authorizeRoles('ADMINISTRATOR', 'ACCOUNTANT'), (req, res) => paymentController.getStudentFeeSummary(req, res));
router.get('/:id', authorizeRoles('ADMINISTRATOR', 'ACCOUNTANT', 'STUDENT'), (req, res) => paymentController.getById(req, res));
router.get('/', authorizeRoles('ADMINISTRATOR', 'ACCOUNTANT'), (req, res) => paymentController.getAll(req, res));
router.post('/', authorizeRoles('ADMINISTRATOR', 'ACCOUNTANT'), (req, res) => paymentController.recordPayment(req, res));

export default router;
