import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    planType: { type: String, enum: ['basic', 'standard', 'premium'], required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
    transactionId: { type: String, required: true },
    paymentMethod: { type: String, default: 'Visa ending 4242' },
    nextBillingDate: { type: Date, required: true },
  },
  { timestamps: true }
);

paymentSchema.index({ user: 1, createdAt: -1 });

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
