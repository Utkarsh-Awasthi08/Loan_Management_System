import { Request, Response } from 'express';
import path from 'path';
import BorrowerProfile from '../models/BorrowerProfile';
import Loan from '../models/Loan';
import { runBRE, calculateLoan } from '../utils/bre';
import { EmploymentMode } from '../types';

// POST /api/borrower/details
export const submitPersonalDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fullName, pan, dateOfBirth, monthlySalary, employmentMode } = req.body;

    if (!fullName || !pan || !dateOfBirth || !monthlySalary || !employmentMode) {
      res.status(400).json({ success: false, message: 'All fields are required.' });
      return;
    }

    // Run BRE on the server (mandatory — client validation is UX only)
    const breResult = runBRE({
      dateOfBirth: new Date(dateOfBirth),
      monthlySalary: Number(monthlySalary),
      pan: pan.toUpperCase(),
      employmentMode: employmentMode as EmploymentMode,
    });

    // Upsert profile
    const profile = await BorrowerProfile.findOneAndUpdate(
      { userId: req.user!.userId },
      {
        userId: req.user!.userId,
        fullName,
        pan: pan.toUpperCase(),
        dateOfBirth: new Date(dateOfBirth),
        monthlySalary: Number(monthlySalary),
        employmentMode,
        breStatus: breResult.passed ? 'PASSED' : 'FAILED',
        breFailureReasons: breResult.failures,
      },
      { new: true, upsert: true, runValidators: true }
    );

    if (!breResult.passed) {
      res.status(422).json({
        success: false,
        message: 'Eligibility check failed.',
        breFailures: breResult.failures,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Personal details saved. Eligibility check passed.',
      data: profile,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error saving details.' });
  }
};

// POST /api/borrower/upload
export const uploadSalarySlip = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No file uploaded.' });
      return;
    }

    const profile = await BorrowerProfile.findOneAndUpdate(
      { userId: req.user!.userId },
      {
        salarySlipUrl: `/uploads/${req.file.filename}`,
        salarySlipType: req.file.mimetype,
      },
      { new: true }
    );

    if (!profile) {
      res.status(404).json({ success: false, message: 'Profile not found. Submit personal details first.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Salary slip uploaded successfully.',
      data: { salarySlipUrl: profile.salarySlipUrl },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error uploading file.' });
  }
};

// POST /api/borrower/apply
export const applyForLoan = async (req: Request, res: Response): Promise<void> => {
  try {
    const { amount, tenureDays } = req.body;

    if (!amount || !tenureDays) {
      res.status(400).json({ success: false, message: 'Loan amount and tenure are required.' });
      return;
    }

    const principal = Number(amount);
    const tenure = Number(tenureDays);

    if (principal < 50000 || principal > 500000) {
      res.status(400).json({ success: false, message: 'Loan amount must be between ₹50,000 and ₹5,00,000.' });
      return;
    }

    if (tenure < 30 || tenure > 365) {
      res.status(400).json({ success: false, message: 'Tenure must be between 30 and 365 days.' });
      return;
    }

    // Check profile and BRE
    const profile = await BorrowerProfile.findOne({ userId: req.user!.userId });
    if (!profile) {
      res.status(400).json({ success: false, message: 'Complete personal details first.' });
      return;
    }

    if (profile.breStatus !== 'PASSED') {
      res.status(403).json({ success: false, message: 'Eligibility check not passed. Cannot apply.' });
      return;
    }

    if (!profile.salarySlipUrl) {
      res.status(400).json({ success: false, message: 'Upload salary slip before applying.' });
      return;
    }

    // Check for existing active loan
    const existingLoan = await Loan.findOne({
      borrowerId: req.user!.userId,
      status: { $in: ['PENDING', 'SANCTIONED', 'DISBURSED'] },
    });
    if (existingLoan) {
      res.status(409).json({ success: false, message: 'You already have an active loan application.' });
      return;
    }

    const { simpleInterest, totalRepayment } = calculateLoan(principal, tenure);

    const loan = await Loan.create({
      borrowerId: req.user!.userId,
      amount: principal,
      tenureDays: tenure,
      interestRate: 12,
      simpleInterest,
      totalRepayment,
      totalPaid: 0,
      outstandingBalance: totalRepayment,
      status: 'PENDING',
    });

    res.status(201).json({
      success: true,
      message: 'Loan application submitted successfully.',
      data: loan,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error applying for loan.' });
  }
};

// GET /api/borrower/me
export const getMyProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const profile = await BorrowerProfile.findOne({ userId: req.user!.userId });
    const loans = await Loan.find({ borrowerId: req.user!.userId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { profile, loans },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching profile.' });
  }
};

// GET /api/borrower/loans/:id
export const getLoanById = async (req: Request, res: Response): Promise<void> => {
  try {
    const loan = await Loan.findOne({ _id: req.params.id, borrowerId: req.user!.userId });
    if (!loan) {
      res.status(404).json({ success: false, message: 'Loan not found.' });
      return;
    }
    res.status(200).json({ success: true, data: loan });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};
