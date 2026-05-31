import { Request, Response } from 'express';
import Loan from '../models/Loan';
import User from '../models/User';
import BorrowerProfile from '../models/BorrowerProfile';
import Payment from '../models/Payment';

// GET /api/loans — with filters for each module
export const getAllLoans = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter: Record<string, unknown> = {};

    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [loans, total] = await Promise.all([
      Loan.find(filter)
        .populate('borrowerId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Loan.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: loans,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching loans.' });
  }
};

// GET /api/loans/:id
export const getLoan = async (req: Request, res: Response): Promise<void> => {
  try {
    const loan = await Loan.findById(req.params.id).populate('borrowerId', 'name email');
    if (!loan) {
      res.status(404).json({ success: false, message: 'Loan not found.' });
      return;
    }

    const profile = await BorrowerProfile.findOne({ userId: (loan.borrowerId as any)._id });
    const payments = await Payment.find({ loanId: loan._id }).sort({ paidAt: -1 });

    res.status(200).json({ success: true, data: { loan, profile, payments } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// PATCH /api/loans/:id/sanction
export const sanctionLoan = async (req: Request, res: Response): Promise<void> => {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) {
      res.status(404).json({ success: false, message: 'Loan not found.' });
      return;
    }

    if (loan.status !== 'PENDING') {
      res.status(400).json({ success: false, message: `Loan is in '${loan.status}' status. Only PENDING loans can be sanctioned.` });
      return;
    }

    loan.status = 'SANCTIONED';
    loan.sanctionedBy = req.user!.userId as any;
    loan.sanctionedAt = new Date();
    await loan.save();

    res.status(200).json({ success: true, message: 'Loan sanctioned successfully.', data: loan });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// PATCH /api/loans/:id/reject
export const rejectLoan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { reason } = req.body;
    if (!reason || reason.trim() === '') {
      res.status(400).json({ success: false, message: 'Rejection reason is required.' });
      return;
    }

    const loan = await Loan.findById(req.params.id);
    if (!loan) {
      res.status(404).json({ success: false, message: 'Loan not found.' });
      return;
    }

    if (loan.status !== 'PENDING') {
      res.status(400).json({ success: false, message: `Only PENDING loans can be rejected.` });
      return;
    }

    loan.status = 'REJECTED';
    loan.rejectionReason = reason.trim();
    await loan.save();

    res.status(200).json({ success: true, message: 'Loan rejected.', data: loan });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// PATCH /api/loans/:id/disburse
export const disburseLoan = async (req: Request, res: Response): Promise<void> => {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) {
      res.status(404).json({ success: false, message: 'Loan not found.' });
      return;
    }

    if (loan.status !== 'SANCTIONED') {
      res.status(400).json({ success: false, message: `Only SANCTIONED loans can be disbursed.` });
      return;
    }

    loan.status = 'DISBURSED';
    loan.disbursedBy = req.user!.userId as any;
    loan.disbursedAt = new Date();
    await loan.save();

    res.status(200).json({ success: true, message: 'Loan disbursed successfully.', data: loan });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// GET /api/sales/leads — Users who registered but have no loan application
export const getSalesLeads = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, page = 1, limit = 20 } = req.query;

    // Get all borrower IDs who have loans
    const borrowersWithLoans = await Loan.distinct('borrowerId');

    const filter: Record<string, unknown> = {
      role: 'BORROWER',
      _id: { $nin: borrowersWithLoans },
    };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      User.find(filter).select('-password').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      User.countDocuments(filter),
    ]);

    // Enrich with profile data
    const enriched = await Promise.all(
      users.map(async (u) => {
        const profile = await BorrowerProfile.findOne({ userId: u._id });
        return { ...u.toObject(), profile };
      })
    );

    res.status(200).json({
      success: true,
      data: enriched,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching leads.' });
  }
};
