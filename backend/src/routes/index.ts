import { Router } from 'express';
import { register, login, getMe } from '../controllers/authController';
import {
  submitPersonalDetails,
  uploadSalarySlip,
  applyForLoan,
  getMyProfile,
  getLoanById,
} from '../controllers/borrowerController';
import {
  getAllLoans,
  getLoan,
  sanctionLoan,
  rejectLoan,
  disburseLoan,
  getSalesLeads,
} from '../controllers/loanController';
import { recordPayment, getPaymentsForLoan } from '../controllers/paymentController';
import { authMiddleware, authorize } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

// ─── Auth ────────────────────────────────────────────────────────────────────
router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/auth/me', authMiddleware, getMe);

// ─── Borrower ────────────────────────────────────────────────────────────────
router.post('/borrower/details', authMiddleware, authorize('BORROWER'), submitPersonalDetails);
router.post('/borrower/upload', authMiddleware, authorize('BORROWER'), upload.single('salarySlip'), uploadSalarySlip);
router.post('/borrower/apply', authMiddleware, authorize('BORROWER'), applyForLoan);
router.get('/borrower/me', authMiddleware, authorize('BORROWER'), getMyProfile);
router.get('/borrower/loans/:id', authMiddleware, authorize('BORROWER'), getLoanById);

// ─── Sales ───────────────────────────────────────────────────────────────────
router.get('/sales/leads', authMiddleware, authorize('SALES', 'ADMIN'), getSalesLeads);

// ─── Loans (Sanction / Disbursement modules) ─────────────────────────────────
router.get('/loans', authMiddleware, authorize('SANCTION', 'DISBURSEMENT', 'COLLECTION', 'ADMIN'), getAllLoans);
router.get('/loans/:id', authMiddleware, authorize('SANCTION', 'DISBURSEMENT', 'COLLECTION', 'ADMIN'), getLoan);
router.patch('/loans/:id/sanction', authMiddleware, authorize('SANCTION', 'ADMIN'), sanctionLoan);
router.patch('/loans/:id/reject', authMiddleware, authorize('SANCTION', 'ADMIN'), rejectLoan);
router.patch('/loans/:id/disburse', authMiddleware, authorize('DISBURSEMENT', 'ADMIN'), disburseLoan);

// ─── Payments (Collection module) ────────────────────────────────────────────
router.post('/payments', authMiddleware, authorize('COLLECTION', 'ADMIN'), recordPayment);
router.get('/payments/:loanId', authMiddleware, authorize('COLLECTION', 'ADMIN'), getPaymentsForLoan);

export default router;
