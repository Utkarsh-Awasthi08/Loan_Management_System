import { Request, Response } from 'express';
import Payment from '../models/Payment';
import Loan from '../models/Loan';

// POST /api/payments
export const recordPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { loanId, utr, amount, paidAt } = req.body;

    if (!loanId || !utr || !amount || !paidAt) {
      res.status(400).json({ success: false, message: 'loanId, UTR, amount, and paidAt are required.' });
      return;
    }

    const paymentAmount = Number(amount);
    if (paymentAmount <= 0) {
      res.status(400).json({ success: false, message: 'Payment amount must be greater than zero.' });
      return;
    }

    // Check loan exists and is DISBURSED
    const loan = await Loan.findById(loanId);
    if (!loan) {
      res.status(404).json({ success: false, message: 'Loan not found.' });
      return;
    }

    if (loan.status !== 'DISBURSED') {
      res.status(400).json({ success: false, message: 'Payments can only be recorded for DISBURSED loans.' });
      return;
    }

    // Validate payment doesn't exceed outstanding balance
    const outstanding = loan.outstandingBalance;
    if (paymentAmount > outstanding) {
      res.status(400).json({
        success: false,
        message: `Payment amount (₹${paymentAmount.toLocaleString('en-IN')}) exceeds outstanding balance (₹${outstanding.toLocaleString('en-IN')}).`,
      });
      return;
    }

    // Check UTR uniqueness (unique index will also enforce this, but give a clean error)
    const existingPayment = await Payment.findOne({ utr: utr.toUpperCase().trim() });
    if (existingPayment) {
      res.status(409).json({ success: false, message: `UTR number '${utr}' already exists. Each payment must have a unique UTR.` });
      return;
    }

    // Create payment
    const payment = await Payment.create({
      loanId,
      utr: utr.toUpperCase().trim(),
      amount: paymentAmount,
      paidAt: new Date(paidAt),
      recordedBy: req.user!.userId,
    });

    // Update loan totals
    const newTotalPaid = loan.totalPaid + paymentAmount;
    const newOutstanding = Math.max(0, loan.totalRepayment - newTotalPaid);

    const shouldClose = newTotalPaid >= loan.totalRepayment;

    loan.totalPaid = newTotalPaid;
    loan.outstandingBalance = newOutstanding;
    if (shouldClose) {
      loan.status = 'CLOSED';
      loan.closedAt = new Date();
    }
    await loan.save();

    res.status(201).json({
      success: true,
      message: shouldClose ? 'Payment recorded. Loan is now CLOSED! 🎉' : 'Payment recorded successfully.',
      data: {
        payment,
        loan: {
          totalPaid: loan.totalPaid,
          outstandingBalance: loan.outstandingBalance,
          status: loan.status,
        },
      },
    });
  } catch (error: any) {
    // Handle MongoDB unique index violation
    if (error.code === 11000 && error.keyPattern?.utr) {
      res.status(409).json({ success: false, message: 'UTR number already exists.' });
      return;
    }
    res.status(500).json({ success: false, message: 'Server error recording payment.' });
  }
};

// GET /api/payments/:loanId
export const getPaymentsForLoan = async (req: Request, res: Response): Promise<void> => {
  try {
    const loan = await Loan.findById(req.params.loanId);
    if (!loan) {
      res.status(404).json({ success: false, message: 'Loan not found.' });
      return;
    }

    const payments = await Payment.find({ loanId: req.params.loanId })
      .populate('recordedBy', 'name')
      .sort({ paidAt: -1 });

    res.status(200).json({ success: true, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};
