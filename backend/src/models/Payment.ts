import mongoose, { Document, Schema } from 'mongoose';

export interface IPayment extends Document {
  loanId: mongoose.Types.ObjectId;
  utr: string;
  amount: number;
  paidAt: Date;
  recordedBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    loanId: { type: Schema.Types.ObjectId, ref: 'Loan', required: true },
    utr: {
      type: String,
      required: true,
      unique: true, // UTR must be globally unique
      trim: true,
      uppercase: true,
    },
    amount: { type: Number, required: true, min: 1 },
    paidAt: { type: Date, required: true },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// Index for fast lookup by loanId
PaymentSchema.index({ loanId: 1 });

export default mongoose.model<IPayment>('Payment', PaymentSchema);
