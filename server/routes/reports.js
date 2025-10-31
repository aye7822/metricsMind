import express from 'express';
import puppeteer from 'puppeteer';
import { body, query, validationResult } from 'express-validator';
import metricsService from '../services/metricsService.js';
import Customer from '../models/Customer.js';
import Plan from '../models/Plan.js';
import Payment from '../models/Payment.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/reports/pdf
// @desc    Generate PDF report
// @access  Private
router.get('/pdf', [
  auth,
  query('startDate').optional().isISO8601().withMessage('Start date must be a valid ISO date'),
  query('endDate').optional().isISO8601().withMessage('End date must be a valid ISO date'),
  query('format').optional().isIn(['A4', 'Letter']).withMessage('Format must be A4 or Letter')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { startDate, endDate, format = 'A4' } = req.query;
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date();

    // Get metrics data
    const metrics = await metricsService.getAllMetrics(req.userId, end);
    const historicalData = await metricsService.getHistoricalData(req.userId, 12);
    const customerGrowth = await metricsService.getCustomerGrowth(req.userId, 12);

    // Get additional data
    const totalCustomers = await Customer.countDocuments({ userId: req.userId });
    const activeCustomers = await Customer.countDocuments({ 
      userId: req.userId, 
      status: 'active' 
    });
    const totalPlans = await Plan.countDocuments({ userId: req.userId });
    const totalRevenue = await Payment.aggregate([
      { $match: { userId: req.userId, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$netAmount' } } }
    ]);

    // Generate HTML report
    const html = generateReportHTML({
      metrics,
      historicalData,
      customerGrowth,
      totalCustomers,
      activeCustomers,
      totalPlans,
      totalRevenue: totalRevenue[0]?.total || 0,
      startDate: start,
      endDate: end,
      generatedAt: new Date()
    });

    // Generate PDF
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdf = await page.pdf({
      format: format,
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      }
    });

    await browser.close();

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="saas-metrics-report-${new Date().toISOString().slice(0, 10)}.pdf"`);
    res.setHeader('Content-Length', pdf.length);

    res.send(pdf);

  } catch (error) {
    console.error('Generate PDF error:', error);
    res.status(500).json({
      error: 'Server error while generating PDF report'
    });
  }
});

// @route   GET /api/reports/summary
// @desc    Get report summary data
// @access  Private
router.get('/summary', [
  auth,
  query('startDate').optional().isISO8601().withMessage('Start date must be a valid ISO date'),
  query('endDate').optional().isISO8601().withMessage('End date must be a valid ISO date')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date();

    // Get comprehensive data
    const metrics = await metricsService.getAllMetrics(req.userId, end);
    const historicalData = await metricsService.getHistoricalData(req.userId, 12);
    const customerGrowth = await metricsService.getCustomerGrowth(req.userId, 12);

    // Get customer breakdown
    const customerBreakdown = await Customer.aggregate([
      { $match: { userId: req.userId } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Get plan performance
    const planPerformance = await Plan.aggregate([
      { $match: { userId: req.userId } },
      {
        $lookup: {
          from: 'customers',
          localField: '_id',
          foreignField: 'plan',
          as: 'customers'
        }
      },
      {
        $project: {
          name: 1,
          price: 1,
          billingCycle: 1,
          customerCount: { $size: '$customers' },
          revenue: {
            $multiply: [
              { $size: '$customers' },
              { $cond: [
                { $eq: ['$billingCycle', 'monthly'] },
                '$price',
                { $cond: [
                  { $eq: ['$billingCycle', 'yearly'] },
                  { $divide: ['$price', 12] },
                  { $divide: ['$price', 3] }
                ]}
              ]}
            ]
          }
        }
      },
      { $sort: { revenue: -1 } }
    ]);

    // Get payment trends
    const paymentTrends = await Payment.aggregate([
      { 
        $match: { 
          userId: req.userId, 
          status: 'completed',
          paymentDate: { $gte: start, $lte: end }
        } 
      },
      {
        $group: {
          _id: {
            year: { $year: '$paymentDate' },
            month: { $month: '$paymentDate' }
          },
          totalAmount: { $sum: '$netAmount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      metrics,
      historicalData,
      customerGrowth,
      customerBreakdown,
      planPerformance,
      paymentTrends,
      period: {
        start,
        end
      }
    });

  } catch (error) {
    console.error('Get report summary error:', error);
    res.status(500).json({
      error: 'Server error while fetching report summary'
    });
  }
});

// Helper function to generate HTML report
function generateReportHTML(data) {
  const {
    metrics,
    historicalData,
    customerGrowth,
    totalCustomers,
    activeCustomers,
    totalPlans,
    totalRevenue,
    startDate,
    endDate,
    generatedAt
  } = data;

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>SaaS Metrics Report</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
            }
            .header {
                text-align: center;
                border-bottom: 2px solid #2563eb;
                padding-bottom: 20px;
                margin-bottom: 30px;
            }
            .header h1 {
                color: #2563eb;
                margin: 0;
                font-size: 2.5em;
            }
            .header p {
                color: #666;
                margin: 10px 0 0 0;
            }
            .metrics-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 20px;
                margin-bottom: 30px;
            }
            .metric-card {
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 20px;
                text-align: center;
            }
            .metric-card h3 {
                margin: 0 0 10px 0;
                color: #4a5568;
                font-size: 0.9em;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .metric-card .value {
                font-size: 2em;
                font-weight: bold;
                color: #2563eb;
                margin: 0;
            }
            .metric-card .change {
                font-size: 0.9em;
                margin-top: 5px;
            }
            .positive { color: #10b981; }
            .negative { color: #ef4444; }
            .section {
                margin-bottom: 30px;
            }
            .section h2 {
                color: #2563eb;
                border-bottom: 1px solid #e2e8f0;
                padding-bottom: 10px;
            }
            .summary-stats {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 15px;
                margin-bottom: 20px;
            }
            .summary-stat {
                text-align: center;
                padding: 15px;
                background: #f8fafc;
                border-radius: 6px;
            }
            .summary-stat .number {
                font-size: 1.5em;
                font-weight: bold;
                color: #2563eb;
            }
            .summary-stat .label {
                font-size: 0.9em;
                color: #6b7280;
                margin-top: 5px;
            }
            .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #e2e8f0;
                text-align: center;
                color: #6b7280;
                font-size: 0.9em;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>SaaS Metrics Report</h1>
            <p>Generated on ${generatedAt.toLocaleDateString()} at ${generatedAt.toLocaleTimeString()}</p>
            <p>Period: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}</p>
        </div>

        <div class="section">
            <h2>Key Performance Indicators</h2>
            <div class="metrics-grid">
                <div class="metric-card">
                    <h3>Monthly Recurring Revenue</h3>
                    <p class="value">$${metrics.mrr.current.toLocaleString()}</p>
                    <p class="change ${metrics.mrr.growth >= 0 ? 'positive' : 'negative'}">
                        ${metrics.mrr.growth >= 0 ? '+' : ''}${metrics.mrr.growth.toFixed(1)}%
                    </p>
                </div>
                <div class="metric-card">
                    <h3>Annual Recurring Revenue</h3>
                    <p class="value">$${metrics.arr.current.toLocaleString()}</p>
                    <p class="change ${metrics.arr.growth >= 0 ? 'positive' : 'negative'}">
                        ${metrics.arr.growth >= 0 ? '+' : ''}${metrics.arr.growth.toFixed(1)}%
                    </p>
                </div>
                <div class="metric-card">
                    <h3>Churn Rate</h3>
                    <p class="value">${metrics.churn.current.toFixed(2)}%</p>
                    <p class="change ${metrics.churn.growth <= 0 ? 'positive' : 'negative'}">
                        ${metrics.churn.growth >= 0 ? '+' : ''}${metrics.churn.growth.toFixed(1)}%
                    </p>
                </div>
                <div class="metric-card">
                    <h3>Customer Lifetime Value</h3>
                    <p class="value">$${metrics.ltv.current.toLocaleString()}</p>
                    <p class="change ${metrics.ltv.growth >= 0 ? 'positive' : 'negative'}">
                        ${metrics.ltv.growth >= 0 ? '+' : ''}${metrics.ltv.growth.toFixed(1)}%
                    </p>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>Business Summary</h2>
            <div class="summary-stats">
                <div class="summary-stat">
                    <div class="number">${totalCustomers.toLocaleString()}</div>
                    <div class="label">Total Customers</div>
                </div>
                <div class="summary-stat">
                    <div class="number">${activeCustomers.toLocaleString()}</div>
                    <div class="label">Active Customers</div>
                </div>
                <div class="summary-stat">
                    <div class="number">${totalPlans.toLocaleString()}</div>
                    <div class="label">Pricing Plans</div>
                </div>
                <div class="summary-stat">
                    <div class="number">$${totalRevenue.toLocaleString()}</div>
                    <div class="label">Total Revenue</div>
                </div>
            </div>
        </div>

        <div class="footer">
            <p>This report was generated automatically by the SaaS Metrics Dashboard</p>
        </div>
    </body>
    </html>
  `;
}

export default router;
