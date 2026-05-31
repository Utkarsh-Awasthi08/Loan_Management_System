import mongoose, { Document, Schema } from 'mongoose';
import { EmploymentMode } from '../types';

export interface IBorrowerProfile extends Document {
  userId: mongoose.Types.ObjectId;
  fullName: string;
  pan: string;
  dateOfBirth: Date;
  monthlySalary: number;
  employmentMode: EmploymentMode;
  salarySlipUrl?: string;
  salarySlipType?: string;
  breStatus: 'PENDING' | 'PASSED' | 'FAILED';
  breFailureReasons: string[];
  createdAt: Date;
  updatedAt: Date;
}

const BorrowerProfileSchema = new Schema<IBorrowerProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    fullName: { type: String, required: true, trim: true },
    pan: { type: String, required: true, uppercase: true, trim: true },
    dateOfBirth: { type: Date, required: true },
    monthlySalary: { type: Number, required: true },
    employmentMode: {
      type: String,
      enum: ['SALARIED', 'SELF_EMPLOYED', 'UNEMPLOYED'],
      required: true,
    },
    salarySlipUrl: { type: String },
    salarySlipType: { type: String },
    breStatus: {
      type: String,
      enum: ['PENDING', 'PASSED', 'FAILED'],
      default: 'PENDING',
    },
    breFailureReasons: [{ type: String }],
  },
  { timestamps: true }
);

export default mongoose.model<IBorrowerProfile>('BorrowerProfile', BorrowerProfileSchema);
