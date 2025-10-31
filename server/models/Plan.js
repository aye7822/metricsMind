import mongoose from 'mongoose';

const planSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Plan name is required'],
    trim: true,
    maxlength: [100, 'Plan name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'yearly', 'quarterly'],
    default: 'monthly'
  },
  features: [{
    type: String,
    trim: true,
    maxlength: [200, 'Feature cannot exceed 200 characters']
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  maxUsers: {
    type: Number,
    default: null,
    min: [1, 'Max users must be at least 1']
  },
  storageLimit: {
    type: Number,
    default: null,
    min: [0, 'Storage limit cannot be negative']
  },
  supportLevel: {
    type: String,
    enum: ['basic', 'priority', 'premium'],
    default: 'basic'
  },
  trialDays: {
    type: Number,
    default: 0,
    min: [0, 'Trial days cannot be negative']
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
planSchema.index({ userId: 1, isActive: 1 });
planSchema.index({ price: 1 });

// Virtual for annual price
planSchema.virtual('annualPrice').get(function() {
  switch (this.billingCycle) {
    case 'monthly':
      return this.price * 12;
    case 'quarterly':
      return this.price * 4;
    case 'yearly':
      return this.price;
    default:
      return this.price;
  }
});

// Method to get effective monthly price
planSchema.methods.getMonthlyPrice = function() {
  switch (this.billingCycle) {
    case 'monthly':
      return this.price;
    case 'quarterly':
      return this.price / 3;
    case 'yearly':
      return this.price / 12;
    default:
      return this.price;
  }
};

export default mongoose.model('Plan', planSchema);
