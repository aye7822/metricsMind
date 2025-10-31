import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['http://localhost:5000', 'http://localhost:80'] 
    : true,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50 // limit each IP to 50 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));

// Initialize OpenAI
const llm = new ChatOpenAI({
  modelName: 'gpt-4-turbo-preview',
  temperature: 0.7,
  openAIApiKey: process.env.OPENAI_API_KEY,
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'AI Insights',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Generate insights endpoint
app.post('/generate', async (req, res) => {
  try {
    const { metrics } = req.body;

    if (!metrics) {
      return res.status(400).json({
        error: 'Metrics data is required'
      });
    }

    // Validate required metrics
    const requiredMetrics = ['mrr', 'churn', 'ltv', 'cac'];
    const missingMetrics = requiredMetrics.filter(metric => !metrics[metric]);
    
    if (missingMetrics.length > 0) {
      return res.status(400).json({
        error: `Missing required metrics: ${missingMetrics.join(', ')}`
      });
    }

    // Generate insights using LangChain
    const insights = await generateInsights(metrics);

    res.json({
      insights,
      generatedAt: new Date().toISOString(),
      model: 'gpt-4-turbo-preview'
    });

  } catch (error) {
    console.error('Generate insights error:', error);
    res.status(500).json({
      error: 'Server error while generating insights'
    });
  }
});

// Generate insights using LangChain
async function generateInsights(metrics) {
  try {
    const systemPrompt = `You are an expert SaaS business analyst. Analyze the provided metrics and generate 3 actionable business insights. 
    
    Focus on:
    1. Revenue growth and sustainability
    2. Customer retention and churn patterns
    3. Unit economics and profitability
    4. Strategic recommendations
    
    Be specific, data-driven, and actionable. Use business terminology appropriate for startup founders and executives.`;

    const userPrompt = `Based on the following SaaS metrics, provide 3 actionable business insights:

    Monthly Recurring Revenue (MRR): $${metrics.mrr.current.toLocaleString()}
    MRR Growth: ${metrics.mrr.growth >= 0 ? '+' : ''}${metrics.mrr.growth.toFixed(1)}%
    
    Churn Rate: ${metrics.churn.current.toFixed(2)}%
    Churn Change: ${metrics.churn.growth >= 0 ? '+' : ''}${metrics.churn.growth.toFixed(1)}%
    
    Customer Lifetime Value (LTV): $${metrics.ltv.current.toLocaleString()}
    LTV Growth: ${metrics.ltv.growth >= 0 ? '+' : ''}${metrics.ltv.growth.toFixed(1)}%
    
    Customer Acquisition Cost (CAC): $${metrics.cac.current.toLocaleString()}
    CAC Change: ${metrics.cac.growth >= 0 ? '+' : ''}${metrics.cac.growth.toFixed(1)}%
    
    Annual Recurring Revenue (ARR): $${metrics.arr.current.toLocaleString()}
    ARR Growth: ${metrics.arr.growth >= 0 ? '+' : ''}${metrics.arr.growth.toFixed(1)}%

    Please provide 3 specific, actionable insights in the following JSON format:
    [
      {
        "type": "positive|warning|info",
        "title": "Brief title",
        "message": "Detailed actionable insight with specific recommendations"
      }
    ]`;

    const messages = [
      new SystemMessage(systemPrompt),
      new HumanMessage(userPrompt)
    ];

    const response = await llm.invoke(messages);
    
    // Try to parse JSON response
    try {
      const insights = JSON.parse(response.content);
      return insights;
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      // Fallback to text parsing
      return parseTextResponse(response.content);
    }

  } catch (error) {
    console.error('LangChain error:', error);
    throw error;
  }
}

// Parse text response into structured format
function parseTextResponse(content) {
  const insights = [];
  const lines = content.split('\n').filter(line => line.trim());
  
  let currentInsight = null;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine.match(/^\d+\./)) {
      // New insight starting
      if (currentInsight) {
        insights.push(currentInsight);
      }
      currentInsight = {
        type: 'info',
        title: trimmedLine.replace(/^\d+\.\s*/, ''),
        message: ''
      };
    } else if (currentInsight && trimmedLine) {
      // Add to current insight message
      currentInsight.message += (currentInsight.message ? ' ' : '') + trimmedLine;
    }
  }
  
  if (currentInsight) {
    insights.push(currentInsight);
  }
  
  // Ensure we have at least 3 insights
  while (insights.length < 3) {
    insights.push({
      type: 'info',
      title: 'Continue Monitoring',
      message: 'Keep tracking your metrics to identify trends and opportunities for growth.'
    });
  }
  
  return insights.slice(0, 3);
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🤖 AI Insights service running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔑 OpenAI API Key: ${process.env.OPENAI_API_KEY ? 'Configured' : 'Missing'}`);
});
