import { useState, useEffect } from 'react'
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  Target,
  Download,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { KPICard } from '@/components/dashboard/KPICard'
import { MRRChart } from '@/components/dashboard/MRRChart'
import { ChurnChart } from '@/components/dashboard/ChurnChart'
import { CustomerGrowthChart } from '@/components/dashboard/CustomerGrowthChart'
import { AIInsights } from '@/components/dashboard/AIInsights'
import { metricsAPI, reportsAPI } from '@/lib/api'
import { toast } from 'react-hot-toast'
import { downloadPDF, generatePDFContent } from '@/lib/downloadUtils'

interface Metrics {
  mrr: { current: number; growth: number }
  arr: { current: number; growth: number }
  churn: { current: number; growth: number }
  ltv: { current: number; growth: number }
  cac: { current: number; growth: number }
}

interface HistoricalData {
  month: string
  mrr: number
  arr: number
  churn: number
  ltv: number
  cac: number
}

interface CustomerGrowthData {
  month: string
  total: number
  active: number
  churned: number
}

export function Dashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([])
  const [customerGrowth, setCustomerGrowth] = useState<CustomerGrowthData[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)
      const [metricsResponse, historicalResponse, growthResponse] = await Promise.all([
        metricsAPI.getMetrics(),
        metricsAPI.getHistoricalData(12),
        metricsAPI.getCustomerGrowth(12)
      ])

      setMetrics(metricsResponse.data.current)
      setHistoricalData(historicalResponse.data.historicalData)
      setCustomerGrowth(growthResponse.data.customerGrowth)
    } catch (error: any) {
      console.error('Failed to fetch dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await metricsAPI.refreshMetrics()
      await fetchData()
      toast.success('Metrics refreshed successfully')
    } catch (error: any) {
      toast.error('Failed to refresh metrics')
    } finally {
      setRefreshing(false)
    }
  }

  const handleDownloadReport = async () => {
    try {
      const response = await reportsAPI.generatePDF({
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        reportId: 'dashboard-summary'
      })
      
      if (response.data.success) {
        const reportData = response.data.reportData
        const pdfContent = generatePDFContent('Dashboard Summary Report', reportData)
        const filename = `dashboard-report-${new Date().toISOString().split('T')[0]}.pdf`
        
        downloadPDF(pdfContent, filename)
        toast.success('Dashboard report downloaded successfully')
      }
    } catch (error: any) {
      toast.error('Failed to generate report')
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="text-lg">Loading dashboard...</span>
          </div>
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
                No data available. Add some customers and plans to get started.
              </p>
              <Button onClick={fetchData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening with your business today.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleDownloadReport}>
            <Download className="h-4 w-4 mr-2" />
            Download Report
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Monthly Recurring Revenue"
          value={metrics.mrr.current}
          growth={metrics.mrr.growth}
          icon={DollarSign}
          format="currency"
          delay={0}
        />
        <KPICard
          title="Churn Rate"
          value={metrics.churn.current}
          growth={metrics.churn.growth}
          icon={Users}
          format="percentage"
          delay={0.1}
        />
        <KPICard
          title="Customer Lifetime Value"
          value={metrics.ltv.current}
          growth={metrics.ltv.growth}
          icon={TrendingUp}
          format="currency"
          delay={0.2}
        />
        <KPICard
          title="Customer Acquisition Cost"
          value={metrics.cac.current}
          growth={metrics.cac.growth}
          icon={Target}
          format="currency"
          delay={0.3}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MRRChart data={historicalData} />
        <ChurnChart data={historicalData} />
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CustomerGrowthChart data={customerGrowth} />
        <AIInsights metrics={metrics} />
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Annual Recurring Revenue</p>
                <p className="text-2xl font-bold">${metrics.arr.current.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">
                  {metrics.arr.growth >= 0 ? '+' : ''}{metrics.arr.growth.toFixed(1)}% vs last month
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">LTV/CAC Ratio</p>
                <p className="text-2xl font-bold">
                  {(metrics.ltv.current / metrics.cac.current).toFixed(1)}:1
                </p>
                <p className="text-sm text-muted-foreground">
                  {metrics.ltv.current / metrics.cac.current > 3 ? 'Healthy' : 'Needs improvement'}
                </p>
              </div>
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
