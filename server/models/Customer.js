import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  company: {
    type: String,
    trim: true,
    maxlength: [100, 'Company name cannot exceed 100 characters']
  },
  status: {
    type: String,
    enum: ['active', 'churned', 'trial', 'suspended'],
    default: 'trial'
  },
  plan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan',
    required: [true, 'Plan is required']
  },
  subscriptionDate: {
    type: Date,
    default: Date.now
  },
  churnDate: {
    type: Date,
    default: null
  },
  churnReason: {
    type: String,
    trim: true,
    maxlength: [500, 'Churn reason cannot exceed 500 characters']
  },
  monthlyRevenue: {
    type: Number,
    required: [true, 'Monthly revenue is required'],
    min: [0, 'Revenue cannot be negative']
  },
  lifetimeValue: {
    type: Number,
    default: 0,
    min: [0, 'LTV cannot be negative']
  },
  acquisitionCost: {
    type: Number,
    default: 0,
    min: [0, 'Acquisition cost cannot be negative']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
customerSchema.index({ userId: 1, status: 1 });
customerSchema.index({ email: 1 });
customerSchema.index({ subscriptionDate: -1 });

// Virtual for customer age in months
customerSchema.virtual('ageInMonths').get(function() {
  const endDate = this.churnDate || new Date();
  const startDate = this.subscriptionDate;
  const diffTime = Math.abs(endDate - startDate);
  const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
  return diffMonths;
});

// Method to calculate LTV
customerSchema.methods.calculateLTV = function(churnRate) {
  if (churnRate === 0) return 0;
  return this.monthlyRevenue / churnRate;
};

export default mongoose.model('Customer', customerSchema);
