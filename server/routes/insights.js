import express from 'express';
import axios from 'axios';
import auth from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/insights/ai
// @desc    Get AI insights for metrics
// @access  Private
router.post('/ai', auth, async (req, res) => {
  try {
    const { metrics } = req.body;

    if (!metrics) {
      return res.status(400).json({
        error: 'Metrics data is required'
      });
    }

    // Call the insights microservice
    const insightsUrl = process.env.INSIGHTS_URL || 'http://localhost:8000';
    
    try {
      const response = await axios.post(`${insightsUrl}/generate`, {
        metrics
      }, {
        timeout: 30000 // 30 second timeout
      });

      res.json({
        insights: response.data.insights,
        generatedAt: new Date().toISOString()
      });

    } catch (insightsError) {
      console.error('Insights service error:', insightsError.message);
      
      // Fallback insights if service is unavailable
      const fallbackInsights = generateFallbackInsights(metrics);
      
      res.json({
        insights: fallbackInsights,
        generatedAt: new Date().toISOString(),
        note: 'Generated using fallback insights (AI service unavailable)'
      });
    }

  } catch (error) {
    console.error('Get AI insights error:', error);
    res.status(500).json({
      error: 'Server error while generating AI insights'
    });
  }
});

// @route   GET /api/insights/health
// @desc    Check insights service health
// @access  Private
router.get('/health', auth, async (req, res) => {
  try {
    const insightsUrl = process.env.INSIGHTS_URL || 'http://localhost:8000';
    
    const response = await axios.get(`${insightsUrl}/health`, {
      timeout: 5000
    });

    res.json({
      status: 'connected',
      insightsService: response.data
    });

  } catch (error) {
    res.json({
      status: 'disconnected',
      error: error.message
    });
  }
});

// Fallback insights generator
function generateFallbackInsights(metrics) {
  const insights = [];

  // MRR insights
  if (metrics.mrr && metrics.mrr.current > 0) {
    if (metrics.mrr.growth > 0) {
      insights.push({
        type: 'positive',
        title: 'Revenue Growth',
        message: `Your MRR is growing at ${metrics.mrr.growth.toFixed(1)}%, indicating strong business momentum. Consider scaling your customer acquisition efforts.`
      });
    } else if (metrics.mrr.growth < -5) {
      insights.push({
        type: 'warning',
        title: 'Revenue Decline',
        message: `Your MRR has decreased by ${Math.abs(metrics.mrr.growth).toFixed(1)}%. Focus on customer retention and new acquisition strategies.`
      });
    }
  }

  // Churn insights
  if (metrics.churn && metrics.churn.current > 0) {
    if (metrics.churn.current < 5) {
      insights.push({
        type: 'positive',
        title: 'Low Churn Rate',
        message: `Your churn rate of ${metrics.churn.current.toFixed(2)}% is excellent! This indicates strong customer satisfaction and product-market fit.`
      });
    } else if (metrics.churn.current > 10) {
      insights.push({
        type: 'warning',
        title: 'High Churn Rate',
        message: `Your churn rate of ${metrics.churn.current.toFixed(2)}% is concerning. Consider improving customer onboarding and support processes.`
      });
    }
  }

  // LTV/CAC insights
  if (metrics.ltv && metrics.cac && metrics.ltv.current > 0 && metrics.cac.current > 0) {
    const ltvCacRatio = metrics.ltv.current / metrics.cac.current;
    if (ltvCacRatio > 3) {
      insights.push({
        type: 'positive',
        title: 'Healthy LTV/CAC Ratio',
        message: `Your LTV/CAC ratio of ${ltvCacRatio.toFixed(1)} is excellent! This indicates efficient customer acquisition and strong unit economics.`
      });
    } else if (ltvCacRatio < 1) {
      insights.push({
        type: 'warning',
        title: 'Poor LTV/CAC Ratio',
        message: `Your LTV/CAC ratio of ${ltvCacRatio.toFixed(1)} is concerning. Consider reducing acquisition costs or increasing customer value.`
      });
    }
  }

  // General insights
  if (insights.length === 0) {
    insights.push({
      type: 'info',
      title: 'Getting Started',
      message: 'Continue tracking your metrics to receive personalized insights. Focus on growing MRR while maintaining low churn rates.'
    });
  }

  return insights;
}

export default router;
