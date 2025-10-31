import express from 'express';
import { body, validationResult, query } from 'express-validator';
import Customer from '../models/Customer.js';
import Plan from '../models/Plan.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/customers
// @desc    Get all customers for user
// @access  Private
router.get('/', [
  auth,
  query('status').optional().isIn(['active', 'churned', 'trial', 'suspended']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().trim().isLength({ max: 100 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { status, page = 1, limit = 10, search } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    const query = { userId: req.userId };
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } }
      ];
    }

    const customers = await Customer.find(query)
      .populate('plan', 'name price billingCycle')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Customer.countDocuments(query);

    res.json({
      customers,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({
      error: 'Server error while fetching customers'
    });
  }
});

// @route   GET /api/customers/:id
// @desc    Get single customer
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.id,
      userId: req.userId
    }).populate('plan');

    if (!customer) {
      return res.status(404).json({
        error: 'Customer not found'
      });
    }

    res.json({ customer });

  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({
      error: 'Server error while fetching customer'
    });
  }
});

// @route   POST /api/customers
// @desc    Create new customer
// @access  Private
router.post('/', [
  auth,
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name is required and must be less than 100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('plan')
    .isMongoId()
    .withMessage('Please provide a valid plan ID'),
  body('monthlyRevenue')
    .isFloat({ min: 0 })
    .withMessage('Monthly revenue must be a positive number'),
  body('company')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Company name cannot exceed 100 characters'),
  body('status')
    .optional()
    .isIn(['active', 'churned', 'trial', 'suspended'])
    .withMessage('Invalid status'),
  body('acquisitionCost')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Acquisition cost must be a positive number'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters')
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
      name,
      email,
      plan,
      monthlyRevenue,
      company,
      status = 'trial',
      acquisitionCost = 0,
      notes,
      tags = []
    } = req.body;

    // Check if plan exists and belongs to user
    const planExists = await Plan.findOne({ _id: plan, userId: req.userId });
    if (!planExists) {
      return res.status(400).json({
        error: 'Plan not found or does not belong to you'
      });
    }

    // Check if customer with email already exists
    const existingCustomer = await Customer.findOne({ email, userId: req.userId });
    if (existingCustomer) {
      return res.status(400).json({
        error: 'Customer with this email already exists'
      });
    }

    const customer = new Customer({
      name,
      email,
      plan,
      monthlyRevenue,
      company,
      status,
      acquisitionCost,
      notes,
      tags,
      userId: req.userId
    });

    await customer.save();
    await customer.populate('plan', 'name price billingCycle');

    res.status(201).json({
      message: 'Customer created successfully',
      customer
    });

  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({
      error: 'Server error while creating customer'
    });
  }
});

// @route   PUT /api/customers/:id
// @desc    Update customer
// @access  Private
router.put('/:id', [
  auth,
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be less than 100 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('plan')
    .optional()
    .isMongoId()
    .withMessage('Please provide a valid plan ID'),
  body('monthlyRevenue')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Monthly revenue must be a positive number'),
  body('status')
    .optional()
    .isIn(['active', 'churned', 'trial', 'suspended'])
    .withMessage('Invalid status'),
  body('churnReason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Churn reason cannot exceed 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const customer = await Customer.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!customer) {
      return res.status(404).json({
        error: 'Customer not found'
      });
    }

    const updateData = { ...req.body };

    // If status is being changed to churned, set churn date
    if (updateData.status === 'churned' && customer.status !== 'churned') {
      updateData.churnDate = new Date();
    }

    // If plan is being changed, verify it exists
    if (updateData.plan) {
      const planExists = await Plan.findOne({ _id: updateData.plan, userId: req.userId });
      if (!planExists) {
        return res.status(400).json({
          error: 'Plan not found or does not belong to you'
        });
      }
    }

    // If email is being changed, check for duplicates
    if (updateData.email && updateData.email !== customer.email) {
      const existingCustomer = await Customer.findOne({ 
        email: updateData.email, 
        userId: req.userId,
        _id: { $ne: customer._id }
      });
      if (existingCustomer) {
        return res.status(400).json({
          error: 'Customer with this email already exists'
        });
      }
    }

    const updatedCustomer = await Customer.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('plan', 'name price billingCycle');

    res.json({
      message: 'Customer updated successfully',
      customer: updatedCustomer
    });

  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({
      error: 'Server error while updating customer'
    });
  }
});

// @route   DELETE /api/customers/:id
// @desc    Delete customer
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const customer = await Customer.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!customer) {
      return res.status(404).json({
        error: 'Customer not found'
      });
    }

    res.json({
      message: 'Customer deleted successfully'
    });

  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({
      error: 'Server error while deleting customer'
    });
  }
});

// @route   GET /api/customers/stats/summary
// @desc    Get customer statistics summary
// @access  Private
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const totalCustomers = await Customer.countDocuments({ userId: req.userId });
    const activeCustomers = await Customer.countDocuments({ 
      userId: req.userId, 
      status: 'active' 
    });
    const churnedCustomers = await Customer.countDocuments({ 
      userId: req.userId, 
      status: 'churned' 
    });
    const trialCustomers = await Customer.countDocuments({ 
      userId: req.userId, 
      status: 'trial' 
    });

    // Calculate average LTV
    const customers = await Customer.find({ userId: req.userId });
    const totalLTV = customers.reduce((sum, customer) => sum + (customer.lifetimeValue || 0), 0);
    const avgLTV = customers.length > 0 ? totalLTV / customers.length : 0;

    res.json({
      total: totalCustomers,
      active: activeCustomers,
      churned: churnedCustomers,
      trial: trialCustomers,
      averageLTV: avgLTV
    });

  } catch (error) {
    console.error('Get customer stats error:', error);
    res.status(500).json({
      error: 'Server error while fetching customer statistics'
    });
  }
});

export default router;

