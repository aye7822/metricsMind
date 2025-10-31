import  { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Brain, RefreshCw, AlertCircle, TrendingUp, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface Metrics {
  mrr: { current: number; growth: number }
  churn: { current: number; growth: number }
  ltv: { current: number; growth: number }
  cac: { current: number; growth: number }
}

interface Insight {
  type: 'positive' | 'warning' | 'info'
  title: string
  message: string
}

interface AIInsightsProps {
  metrics: Metrics
}

export function AIInsights({ metrics }: AIInsightsProps) {
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(false)

  const generateInsights = () => {
    const newInsights: Insight[] = []

    // MRR insights
    if (metrics.mrr.growth > 0) {
      newInsights.push({
        type: 'positive',
        title: 'Revenue Growth',
        message: `Your MRR is growing at ${metrics.mrr.growth.toFixed(1)}%, indicating strong business momentum. Consider scaling your customer acquisition efforts.`
      })
    } else if (metrics.mrr.growth < -5) {
      newInsights.push({
        type: 'warning',
        title: 'Revenue Decline',
        message: `Your MRR has decreased by ${Math.abs(metrics.mrr.growth).toFixed(1)}%. Focus on customer retention and new acquisition strategies.`
      })
    }

    // Churn insights
    if (metrics.churn.current < 5) {
      newInsights.push({
        type: 'positive',
        title: 'Low Churn Rate',
        message: `Your churn rate of ${metrics.churn.current.toFixed(2)}% is excellent! This indicates strong customer satisfaction and product-market fit.`
      })
    } else if (metrics.churn.current > 10) {
      newInsights.push({
        type: 'warning',
        title: 'High Churn Rate',
        message: `Your churn rate of ${metrics.churn.current.toFixed(2)}% is concerning. Consider improving customer onboarding and support processes.`
      })
    }

    // LTV/CAC insights
    const ltvCacRatio = metrics.ltv.current / metrics.cac.current
    if (ltvCacRatio > 3) {
      newInsights.push({
        type: 'positive',
        title: 'Healthy LTV/CAC Ratio',
        message: `Your LTV/CAC ratio of ${ltvCacRatio.toFixed(1)} is excellent! This indicates efficient customer acquisition and strong unit economics.`
      })
    } else if (ltvCacRatio < 1) {
      newInsights.push({
        type: 'warning',
        title: 'Poor LTV/CAC Ratio',
        message: `Your LTV/CAC ratio of ${ltvCacRatio.toFixed(1)} is concerning. Consider reducing acquisition costs or increasing customer value.`
      })
    }

    // General insights
    if (newInsights.length === 0) {
      newInsights.push({
        type: 'info',
        title: 'Getting Started',
        message: 'Continue tracking your metrics to receive personalized insights. Focus on growing MRR while maintaining low churn rates.'
      })
    }

    return newInsights
  }

  const handleRefresh = async () => {
    setLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setInsights(generateInsights())
    setLoading(false)
  }

  useEffect(() => {
    setInsights(generateInsights())
  }, [metrics])

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'positive':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-blue-600" />
    }
  }

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'positive':
        return 'border-green-200 bg-green-50'
      case 'warning':
        return 'border-yellow-200 bg-yellow-50'
      default:
        return 'border-blue-200 bg-blue-50'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.4 }}
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Brain className="h-5 w-5 mr-2" />
              AI Insights
            </CardTitle>
            <CardDescription>Personalized recommendations based on your metrics</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {insights.map((insight, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className={`p-3 rounded-lg border ${getInsightColor(insight.type)}`}
            >
              <div className="flex items-start space-x-2">
                {getInsightIcon(insight.type)}
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{insight.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{insight.message}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  )
}