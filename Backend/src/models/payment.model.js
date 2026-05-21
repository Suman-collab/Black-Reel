import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    planType: { type: String, enum: ['basic', 'standard', 'premium'], required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
    checkoutSessionId: { type: String, trim: true },
    transactionId: { type: String, required: true },
    billingEmail: { type: String, trim: true, lowercase: true, required: true },
    paymentMethod: { type: String, default: 'Pending confirmation' },
    nextBillingDate: { type: Date, required: true },
    completedAt: Date,
    failedAt: Date,
    failureReason: { type: String, trim: true },
  },
  { timestamps: true }
);

paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ checkoutSessionId: 1 }, { unique: true, sparse: true });

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
