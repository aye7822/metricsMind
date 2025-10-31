import express from 'express';
import { body, validationResult, query } from 'express-validator';
import Payment from '../models/Payment.js';
import Customer from '../models/Customer.js';
import Plan from '../models/Plan.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/payments
// @desc    Get all payments for user
// @access  Private
router.get('/', [
  auth,
  query('status').optional().isIn(['pending', 'completed', 'failed', 'refunded', 'cancelled']),
  query('customer').optional().isMongoId(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { 
      status, 
      customer, 
      page = 1, 
      limit = 10, 
      startDate, 
      endDate 
    } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    const query = { userId: req.userId };
    if (status) query.status = status;
    if (customer) query.customer = customer;
    if (startDate || endDate) {
      query.paymentDate = {};
      if (startDate) query.paymentDate.$gte = new Date(startDate);
      if (endDate) query.paymentDate.$lte = new Date(endDate);
    }

    const payments = await Payment.find(query)
      .populate('customer', 'name email company')
      .populate('plan', 'name price billingCycle')
      .sort({ paymentDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Payment.countDocuments(query);

    res.json({
      payments,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({
      error: 'Server error while fetching payments'
    });
  }
});

// @route   GET /api/payments/:id
// @desc    Get single payment
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const payment = await Payment.findOne({
      _id: req.params.id,
      userId: req.userId
    })
    .populate('customer', 'name email company')
    .populate('plan', 'name price billingCycle');

    if (!payment) {
      return res.status(404).json({
        error: 'Payment not found'
      });
    }

    res.json({ payment });

  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({
      error: 'Server error while fetching payment'
    });
  }
});

// @route   POST /api/payments
// @desc    Create new payment
// @access  Private
router.post('/', [
  auth,
  body('customer')
    .isMongoId()
    .withMessage('Please provide a valid customer ID'),
  body('plan')
    .isMongoId()
    .withMessage('Please provide a valid plan ID'),
  body('amount')
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number'),
  body('currency')
    .optional()
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency must be 3 characters'),
  body('status')
    .optional()
    .isIn(['pending', 'completed', 'failed', 'refunded', 'cancelled'])
    .withMessage('Invalid status'),
  body('paymentMethod')
    .optional()
    .isIn(['credit_card', 'paypal', 'stripe', 'bank_transfer', 'other'])
    .withMessage('Invalid payment method'),
  body('transactionId')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Transaction ID cannot exceed 100 characters'),
  body('dueDate')
    .isISO8601()
    .withMessage('Due date must be a valid date'),
  body('billingPeriod.start')
    .isISO8601()
    .withMessage('Billing period start must be a valid date'),
  body('billingPeriod.end')
    .isISO8601()
    .withMessage('Billing period end must be a valid date'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const {
      customer,
      plan,
      amount,
      currency = 'USD',
      status = 'pending',
      paymentMethod = 'credit_card',
      transactionId,
      dueDate,
      billingPeriod,
      notes
    } = req.body;

    // Check if customer exists and belongs to user
    const customerExists = await Customer.findOne({ 
      _id: customer, 
      userId: req.userId 
    });
    if (!customerExists) {
      return res.status(400).json({
        error: 'Customer not found or does not belong to you'
      });
    }

    // Check if plan exists and belongs to user
    const planExists = await Plan.findOne({ 
      _id: plan, 
      userId: req.userId 
    });
    if (!planExists) {
      return res.status(400).json({
        error: 'Plan not found or does not belong to you'
      });
    }

    // Check if transaction ID is unique (if provided)
    if (transactionId) {
      const existingPayment = await Payment.findOne({ transactionId });
      if (existingPayment) {
        return res.status(400).json({
          error: 'Transaction ID already exists'
        });
      }
    }

    const payment = new Payment({
      customer,
      plan,
      amount,
      currency,
      status,
      paymentMethod,
      transactionId,
      dueDate: new Date(dueDate),
      billingPeriod: {
        start: new Date(billingPeriod.start),
        end: new Date(billingPeriod.end)
      },
      notes,
      userId: req.userId
    });

    await payment.save();
    await payment.populate('customer', 'name email company');
    await payment.populate('plan', 'name price billingCycle');

    res.status(201).json({
      message: 'Payment created successfully',
      payment
    });

  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({
      error: 'Server error while creating payment'
    });
  }
});

// @route   PUT /api/payments/:id
// @desc    Update payment
// @access  Private
router.put('/:id', [
  auth,
  body('status')
    .optional()
    .isIn(['pending', 'completed', 'failed', 'refunded', 'cancelled'])
    .withMessage('Invalid status'),
  body('amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters'),
  body('refundAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Refund amount must be a positive number'),
  body('refundReason')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Refund reason cannot exceed 200 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const payment = await Payment.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!payment) {
      return res.status(404).json({
        error: 'Payment not found'
      });
    }

    const updateData = { ...req.body };

    // If refund amount is being set, set refund date
    if (updateData.refundAmount && updateData.refundAmount > 0) {
      updateData.refundDate = new Date();
    }

    // Validate refund amount doesn't exceed payment amount
    if (updateData.refundAmount && updateData.refundAmount > payment.amount) {
      return res.status(400).json({
        error: 'Refund amount cannot exceed payment amount'
      });
    }

    const updatedPayment = await Payment.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('customer', 'name email company')
    .populate('plan', 'name price billingCycle');

    res.json({
      message: 'Payment updated successfully',
      payment: updatedPayment
    });

  } catch (error) {
    console.error('Update payment error:', error);
    res.status(500).json({
      error: 'Server error while updating payment'
    });
  }
});

// @route   DELETE /api/payments/:id
// @desc    Delete payment
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const payment = await Payment.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!payment) {
      return res.status(404).json({
        error: 'Payment not found'
      });
    }

    // Don't allow deletion of completed payments
    if (payment.status === 'completed') {
      return res.status(400).json({
        error: 'Cannot delete completed payments'
      });
    }

    await Payment.findByIdAndDelete(req.params.id);

    res.json({
      message: 'Payment deleted successfully'
    });

  } catch (error) {
    console.error('Delete payment error:', error);
    res.status(500).json({
      error: 'Server error while deleting payment'
    });
  }
});

// @route   GET /api/payments/stats/summary
// @desc    Get payment statistics summary
// @access  Private
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const totalPayments = await Payment.countDocuments({ userId: req.userId });
    const completedPayments = await Payment.countDocuments({ 
      userId: req.userId, 
      status: 'completed' 
    });
    const pendingPayments = await Payment.countDocuments({ 
      userId: req.userId, 
      status: 'pending' 
    });
    const failedPayments = await Payment.countDocuments({ 
      userId: req.userId, 
      status: 'failed' 
    });

    // Calculate total revenue
    const completedPaymentsData = await Payment.find({
      userId: req.userId,
      status: 'completed'
    });
    
    const totalRevenue = completedPaymentsData.reduce((sum, payment) => {
      return sum + payment.netAmount;
    }, 0);

    // Calculate monthly revenue
    const currentMonth = new Date();
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    const monthlyPayments = await Payment.find({
      userId: req.userId,
      status: 'completed',
      paymentDate: { $gte: startOfMonth, $lte: endOfMonth }
    });

    const monthlyRevenue = monthlyPayments.reduce((sum, payment) => {
      return sum + payment.netAmount;
    }, 0);

    res.json({
      total: totalPayments,
      completed: completedPayments,
      pending: pendingPayments,
      failed: failedPayments,
      totalRevenue,
      monthlyRevenue
    });

  } catch (error) {
    console.error('Get payment stats error:', error);
    res.status(500).json({
      error: 'Server error while fetching payment statistics'
    });
  }
});

export default router;
