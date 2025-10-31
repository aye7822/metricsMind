import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: [true, 'Customer is required']
  },
  plan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan',
    required: [true, 'Plan is required']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true,
    length: [3, 'Currency must be 3 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded', 'cancelled'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'paypal', 'stripe', 'bank_transfer', 'other'],
    default: 'credit_card'
  },
  transactionId: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  paymentDate: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  billingPeriod: {
    start: {
      type: Date,
      required: [true, 'Billing period start is required']
    },
    end: {
      type: Date,
      required: [true, 'Billing period end is required']
    }
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  refundAmount: {
    type: Number,
    default: 0,
    min: [0, 'Refund amount cannot be negative']
  },
  refundDate: {
    type: Date,
    default: null
  },
  refundReason: {
    type: String,
    trim: true,
    maxlength: [200, 'Refund reason cannot exceed 200 characters']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
paymentSchema.index({ userId: 1, paymentDate: -1 });
paymentSchema.index({ customer: 1, paymentDate: -1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ transactionId: 1 });

// Virtual for net amount (amount - refund)
paymentSchema.virtual('netAmount').get(function() {
  return this.amount - this.refundAmount;
});

// Method to check if payment is overdue
paymentSchema.methods.isOverdue = function() {
  return this.status === 'pending' && new Date() > this.dueDate;
};

// Method to calculate days overdue
paymentSchema.methods.getDaysOverdue = function() {
  if (!this.isOverdue()) return 0;
  const diffTime = new Date() - this.dueDate;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export default mongoose.model('Payment', paymentSchema);
