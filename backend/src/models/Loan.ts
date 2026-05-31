import mongoose, { Document, Schema } from 'mongoose';
import { LoanStatus } from '../types';

export interface ILoan extends Document {
  borrowerId: mongoose.Types.ObjectId;
  amount: number;
  tenureDays: number;
  interestRate: number;
  simpleInterest: number;
  totalRepayment: number;
  totalPaid: number;
  outstandingBalance: number;
  status: LoanStatus;
  rejectionReason?: string;
  sanctionedBy?: mongoose.Types.ObjectId;
  sanctionedAt?: Date;
  disbursedBy?: mongoose.Types.ObjectId;
  disbursedAt?: Date;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LoanSchema = new Schema<ILoan>(
  {
    borrowerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 50000, max: 500000 },
    tenureDays: { type: Number, required: true, min: 30, max: 365 },
    interestRate: { type: Number, default: 12 }, // 12% p.a. fixed
    simpleInterest: { type: Number, required: true },
    totalRepayment: { type: Number, required: true },
    totalPaid: { type: Number, default: 0 },
    outstandingBalance: { type: Number, required: true },
    status: {
      type: String,
      enum: ['PENDING', 'SANCTIONED', 'DISBURSED', 'CLOSED', 'REJECTED'],
      default: 'PENDING',
    },
    rejectionReason: { type: String },
    sanctionedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    sanctionedAt: { type: Date },
    disbursedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    disbursedAt: { type: Date },
    closedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model<ILoan>('Loan', LoanSchema);
