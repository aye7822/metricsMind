import express from 'express';
import { body, validationResult, query } from 'express-validator';
import Plan from '../models/Plan.js';
import Customer from '../models/Customer.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/plans
// @desc    Get all plans for user
// @access  Private
router.get('/', [
  auth,
  query('isActive').optional().isBoolean(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { isActive, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    const query = { userId: req.userId };
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const plans = await Plan.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Plan.countDocuments(query);

    // Get customer count for each plan
    const plansWithCustomerCount = await Promise.all(
      plans.map(async (plan) => {
        const customerCount = await Customer.countDocuments({
          plan: plan._id,
          userId: req.userId,
          status: 'active'
        });
        return {
          ...plan.toObject(),
          customerCount
        };
      })
    );

    res.json({
      plans: plansWithCustomerCount,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({
      error: 'Server error while fetching plans'
    });
  }
});

// @route   GET /api/plans/:id
// @desc    Get single plan
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const plan = await Plan.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!plan) {
      return res.status(404).json({
        error: 'Plan not found'
      });
    }

    // Get customer count for this plan
    const customerCount = await Customer.countDocuments({
      plan: plan._id,
      userId: req.userId,
      status: 'active'
    });

    res.json({
      plan: {
        ...plan.toObject(),
        customerCount
      }
    });

  } catch (error) {
    console.error('Get plan error:', error);
    res.status(500).json({
      error: 'Server error while fetching plan'
    });
  }
});

// @route   POST /api/plans
// @desc    Create new plan
// @access  Private
router.post('/', [
  auth,
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Plan name is required and must be less than 100 characters'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('billingCycle')
    .isIn(['monthly', 'yearly', 'quarterly'])
    .withMessage('Billing cycle must be monthly, yearly, or quarterly'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('features')
    .optional()
    .isArray()
    .withMessage('Features must be an array'),
  body('maxUsers')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Max users must be a positive integer'),
  body('storageLimit')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Storage limit must be a non-negative integer'),
  body('supportLevel')
    .optional()
    .isIn(['basic', 'priority', 'premium'])
    .withMessage('Support level must be basic, priority, or premium'),
  body('trialDays')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Trial days must be a non-negative integer')
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
      description,
      price,
      billingCycle,
      features = [],
      isActive = true,
      maxUsers,
      storageLimit,
      supportLevel = 'basic',
      trialDays = 0
    } = req.body;

    // Check if plan with same name already exists
    const existingPlan = await Plan.findOne({ 
      name, 
      userId: req.userId 
    });
    if (existingPlan) {
      return res.status(400).json({
        error: 'Plan with this name already exists'
      });
    }

    const plan = new Plan({
      name,
      description,
      price,
      billingCycle,
      features,
      isActive,
      maxUsers,
      storageLimit,
      supportLevel,
      trialDays,
      userId: req.userId
    });

    await plan.save();

    res.status(201).json({
      message: 'Plan created successfully',
      plan
    });

  } catch (error) {
    console.error('Create plan error:', error);
    res.status(500).json({
      error: 'Server error while creating plan'
    });
  }
});

// @route   PUT /api/plans/:id
// @desc    Update plan
// @access  Private
router.put('/:id', [
  auth,
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Plan name must be less than 100 characters'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('billingCycle')
    .optional()
    .isIn(['monthly', 'yearly', 'quarterly'])
    .withMessage('Billing cycle must be monthly, yearly, or quarterly'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('features')
    .optional()
    .isArray()
    .withMessage('Features must be an array'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  body('maxUsers')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Max users must be a positive integer'),
  body('storageLimit')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Storage limit must be a non-negative integer'),
  body('supportLevel')
    .optional()
    .isIn(['basic', 'priority', 'premium'])
    .withMessage('Support level must be basic, priority, or premium'),
  body('trialDays')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Trial days must be a non-negative integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const plan = await Plan.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!plan) {
      return res.status(404).json({
        error: 'Plan not found'
      });
    }

    // Check if name is being changed and if it conflicts
    if (req.body.name && req.body.name !== plan.name) {
      const existingPlan = await Plan.findOne({ 
        name: req.body.name, 
        userId: req.userId,
        _id: { $ne: plan._id }
      });
      if (existingPlan) {
        return res.status(400).json({
          error: 'Plan with this name already exists'
        });
      }
    }

    const updatedPlan = await Plan.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Plan updated successfully',
      plan: updatedPlan
    });

  } catch (error) {
    console.error('Update plan error:', error);
    res.status(500).json({
      error: 'Server error while updating plan'
    });
  }
});

// @route   DELETE /api/plans/:id
// @desc    Delete plan
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const plan = await Plan.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!plan) {
      return res.status(404).json({
        error: 'Plan not found'
      });
    }

    // Check if plan has active customers
    const activeCustomers = await Customer.countDocuments({
      plan: plan._id,
      userId: req.userId,
      status: 'active'
    });

    if (activeCustomers > 0) {
      return res.status(400).json({
        error: 'Cannot delete plan with active customers'
      });
    }

    await Plan.findByIdAndDelete(req.params.id);

    res.json({
      message: 'Plan deleted successfully'
    });

  } catch (error) {
    console.error('Delete plan error:', error);
    res.status(500).json({
      error: 'Server error while deleting plan'
    });
  }
});

// @route   GET /api/plans/stats/summary
// @desc    Get plan statistics summary
// @access  Private
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const totalPlans = await Plan.countDocuments({ userId: req.userId });
    const activePlans = await Plan.countDocuments({ 
      userId: req.userId, 
      isActive: true 
    });

    // Get revenue by plan
    const plans = await Plan.find({ userId: req.userId });
    const revenueByPlan = await Promise.all(
      plans.map(async (plan) => {
        const customers = await Customer.find({
          plan: plan._id,
          userId: req.userId,
          status: 'active'
        });
        const revenue = customers.reduce((sum, customer) => {
          return sum + customer.monthlyRevenue;
        }, 0);
        return {
          planId: plan._id,
          planName: plan.name,
          customerCount: customers.length,
          revenue
        };
      })
    );

    res.json({
      total: totalPlans,
      active: activePlans,
      revenueByPlan
    });

  } catch (error) {
    console.error('Get plan stats error:', error);
    res.status(500).json({
      error: 'Server error while fetching plan statistics'
    });
  }
});

export default router;
