import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    planType: { type: String, enum: ['basic', 'standard', 'premium'], required: true },
    planId: { type: String },
    planName: { type: String },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: { 
      type: String, 
      enum: ['pending', 'completed', 'failed', 'success', 'refunded'], 
      default: 'pending' 
    },
    checkoutSessionId: { type: String, trim: true },
    orderId: { type: String },
    transactionId: { type: String, required: true, unique: true },
    billingEmail: { type: String, trim: true, lowercase: true },
    paymentMethod: { type: String, default: 'Pending confirmation' },
    paymentMode: { 
      type: String, 
      enum: ['dummy', 'stripe', 'razorpay'], 
      default: 'dummy' 
    },
    cardLast4: { type: String },
    cardBrand: { type: String },
    nextBillingDate: { type: Date },
    completedAt: Date,
    failedAt: Date,
    failureReason: { type: String, trim: true },
    paidAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ checkoutSessionId: 1 }, { unique: true, sparse: true });

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
