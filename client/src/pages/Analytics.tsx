import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, TrendingUp, Users, DollarSign, Activity, Download } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { metricsAPI } from '@/lib/api'
import { toast } from 'react-hot-toast'
import { downloadCSV, downloadPDF, generatePDFContent } from '@/lib/downloadUtils'

export function Analytics() {
  const [metrics, setMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await metricsAPI.getMetrics()
      setMetrics(response.data.current)
    } catch (error) {
      toast.error('Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  const handleExportData = async () => {
    try {
      setExporting(true)
      const response = await metricsAPI.exportData('json')
      
      if (response.data.success) {
        const exportData = response.data.exportData
        const filename = `analytics-data-${new Date().toISOString().split('T')[0]}.json`
        
        // Create JSON content
        const jsonString = JSON.stringify(exportData, null, 2)
        const blob = new Blob([jsonString], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        
        toast.success('Analytics data exported successfully')
      }
    } catch (error) {
      toast.error('Failed to export data')
    } finally {
      setExporting(false)
    }
  }

  const handleExportCSV = async () => {
    try {
      setExporting(true)
      const response = await metricsAPI.exportData('csv')
      
      if (response.data.success) {
        const exportData = response.data.exportData
        const filename = `analytics-data-${new Date().toISOString().split('T')[0]}.csv`
        
        // Convert metrics to CSV format
        const csvData = [
          { Metric: 'MRR', Value: exportData.metrics.mrr.current, Growth: exportData.metrics.mrr.growth },
          { Metric: 'Churn Rate', Value: exportData.metrics.churn.current, Growth: exportData.metrics.churn.growth },
          { Metric: 'LTV', Value: exportData.metrics.ltv.current, Growth: exportData.metrics.ltv.growth },
          { Metric: 'CAC', Value: exportData.metrics.cac.current, Growth: exportData.metrics.cac.growth }
        ]
        
        downloadCSV(csvData, filename)
        toast.success('Analytics data exported as CSV successfully')
      }
    } catch (error) {
      toast.error('Failed to export CSV data')
    } finally {
      setExporting(false)
    }
  }

  const handleExportPDF = async () => {
    try {
      setExporting(true)
      const response = await metricsAPI.exportData('pdf')
      
      if (response.data.success) {
        const exportData = response.data.exportData
        const pdfContent = generatePDFContent('Analytics Data Report', exportData)
        const filename = `analytics-report-${new Date().toISOString().split('T')[0]}.pdf`
        
        downloadPDF(pdfContent, filename)
        toast.success('Analytics report exported as PDF successfully')
      }
    } catch (error) {
      toast.error('Failed to export PDF report')
    } finally {
      setExporting(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [])

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-lg text-muted-foreground mb-4">
                No analytics data available
              </p>
              <Button onClick={fetchAnalytics}>
                Refresh Data
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
            <p className="text-muted-foreground mt-2">
              Deep insights into your business performance
            </p>
          </div>
          <div className="flex space-x-2">
            <Button onClick={handleExportData} disabled={exporting}>
              <Download className="w-4 h-4 mr-2" />
              {exporting ? 'Exporting...' : 'Export JSON'}
            </Button>
            <Button onClick={handleExportCSV} variant="outline" disabled={exporting}>
              <Download className="w-4 h-4 mr-2" />
              CSV
            </Button>
            <Button onClick={handleExportPDF} variant="outline" disabled={exporting}>
              <Download className="w-4 h-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Key Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Growth</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{metrics.mrr.growth.toFixed(1)}%</div>
            <p className="text-xs text-green-600">
              +2.1% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customer Acquisition</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-green-600">
              +156 from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Recurring Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.mrr.current.toLocaleString()}</div>
            <p className="text-xs text-green-600">
              +$3,456 from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.churn.current.toFixed(1)}%</div>
            <p className="text-xs text-red-600">
              -0.8% from last month
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trends</CardTitle>
            <CardDescription>
              Monthly recurring revenue over the last 12 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Revenue chart will be displayed here</p>
                <p className="text-sm">Connect to your data source to see revenue trends</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer Growth</CardTitle>
            <CardDescription>
              New customer acquisition over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Growth chart will be displayed here</p>
                <p className="text-sm">Connect to your data source to see customer growth</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Additional Analytics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Plans</CardTitle>
            <CardDescription>
              Most popular subscription plans
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Professional</span>
                <span className="text-sm font-medium">65%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Basic</span>
                <span className="text-sm font-medium">25%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Enterprise</span>
                <span className="text-sm font-medium">10%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Geographic Distribution</CardTitle>
            <CardDescription>
              Customer distribution by region
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">North America</span>
                <span className="text-sm font-medium">45%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Europe</span>
                <span className="text-sm font-medium">30%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Asia Pacific</span>
                <span className="text-sm font-medium">25%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conversion Funnel</CardTitle>
            <CardDescription>
              User journey from trial to paid
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Trial Signups</span>
                <span className="text-sm font-medium">1,000</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Active Trials</span>
                <span className="text-sm font-medium">750</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Paid Conversions</span>
                <span className="text-sm font-medium">375</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
