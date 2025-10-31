import express from 'express';
import { query } from 'express-validator';
import metricsService from '../services/metricsService.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/metrics
// @desc    Get all metrics for user
// @access  Private
router.get('/', [
  auth,
  query('date').optional().isISO8601().withMessage('Date must be a valid ISO date'),
  query('months').optional().isInt({ min: 1, max: 24 }).withMessage('Months must be between 1 and 24')
], async (req, res) => {
  try {
    const { date, months = 12 } = req.query;
    const targetDate = date ? new Date(date) : new Date();

    const metrics = await metricsService.getAllMetrics(req.userId, targetDate);
    const historicalData = await metricsService.getHistoricalData(req.userId, parseInt(months));
    const customerGrowth = await metricsService.getCustomerGrowth(req.userId, parseInt(months));

    res.json({
      current: metrics,
      historical: historicalData,
      customerGrowth
    });

  } catch (error) {
    console.error('Get metrics error:', error);
    res.status(500).json({
      error: 'Server error while fetching metrics'
    });
  }
});

// @route   GET /api/metrics/mrr
// @desc    Get MRR metrics
// @access  Private
router.get('/mrr', [
  auth,
  query('date').optional().isISO8601().withMessage('Date must be a valid ISO date')
], async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();

    const mrr = await metricsService.calculateMRR(req.userId, targetDate);

    res.json({ mrr });

  } catch (error) {
    console.error('Get MRR error:', error);
    res.status(500).json({
      error: 'Server error while fetching MRR'
    });
  }
});

// @route   GET /api/metrics/arr
// @desc    Get ARR metrics
// @access  Private
router.get('/arr', [
  auth,
  query('date').optional().isISO8601().withMessage('Date must be a valid ISO date')
], async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();

    const arr = await metricsService.calculateARR(req.userId, targetDate);

    res.json({ arr });

  } catch (error) {
    console.error('Get ARR error:', error);
    res.status(500).json({
      error: 'Server error while fetching ARR'
    });
  }
});

// @route   GET /api/metrics/churn
// @desc    Get churn rate metrics
// @access  Private
router.get('/churn', [
  auth,
  query('date').optional().isISO8601().withMessage('Date must be a valid ISO date')
], async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();

    const churn = await metricsService.calculateChurnRate(req.userId, targetDate);

    res.json({ churn });

  } catch (error) {
    console.error('Get churn rate error:', error);
    res.status(500).json({
      error: 'Server error while fetching churn rate'
    });
  }
});

// @route   GET /api/metrics/ltv
// @desc    Get LTV metrics
// @access  Private
router.get('/ltv', [
  auth,
  query('date').optional().isISO8601().withMessage('Date must be a valid ISO date')
], async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();

    const ltv = await metricsService.calculateLTV(req.userId, targetDate);

    res.json({ ltv });

  } catch (error) {
    console.error('Get LTV error:', error);
    res.status(500).json({
      error: 'Server error while fetching LTV'
    });
  }
});

// @route   GET /api/metrics/cac
// @desc    Get CAC metrics
// @access  Private
router.get('/cac', [
  auth,
  query('date').optional().isISO8601().withMessage('Date must be a valid ISO date')
], async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();

    const cac = await metricsService.calculateCAC(req.userId, targetDate);

    res.json({ cac });

  } catch (error) {
    console.error('Get CAC error:', error);
    res.status(500).json({
      error: 'Server error while fetching CAC'
    });
  }
});

// @route   GET /api/metrics/historical
// @desc    Get historical metrics data
// @access  Private
router.get('/historical', [
  auth,
  query('months').optional().isInt({ min: 1, max: 24 }).withMessage('Months must be between 1 and 24')
], async (req, res) => {
  try {
    const { months = 12 } = req.query;

    const historicalData = await metricsService.getHistoricalData(req.userId, parseInt(months));

    res.json({ historicalData });

  } catch (error) {
    console.error('Get historical data error:', error);
    res.status(500).json({
      error: 'Server error while fetching historical data'
    });
  }
});

// @route   GET /api/metrics/customer-growth
// @desc    Get customer growth data
// @access  Private
router.get('/customer-growth', [
  auth,
  query('months').optional().isInt({ min: 1, max: 24 }).withMessage('Months must be between 1 and 24')
], async (req, res) => {
  try {
    const { months = 12 } = req.query;

    const customerGrowth = await metricsService.getCustomerGrowth(req.userId, parseInt(months));

    res.json({ customerGrowth });

  } catch (error) {
    console.error('Get customer growth error:', error);
    res.status(500).json({
      error: 'Server error while fetching customer growth data'
    });
  }
});

// @route   POST /api/metrics/refresh
// @desc    Refresh metrics cache
// @access  Private
router.post('/refresh', auth, async (req, res) => {
  try {
    metricsService.clearCache();
    
    res.json({
      message: 'Metrics cache refreshed successfully'
    });

  } catch (error) {
    console.error('Refresh metrics error:', error);
    res.status(500).json({
      error: 'Server error while refreshing metrics'
    });
  }
});

export default router;
