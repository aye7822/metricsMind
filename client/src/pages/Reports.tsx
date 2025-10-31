import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FileText, Download, Calendar, BarChart3, TrendingUp, Users, Link2, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { reportsAPI } from '@/lib/api'
import { toast } from 'react-hot-toast'
import { downloadPDF, generatePDFContent } from '@/lib/downloadUtils'
import { useNavigate } from 'react-router-dom'

interface Report {
  id: string
  name: string
  description: string
  type: string
  lastGenerated: string
  status: string
}

export function Reports() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState('All')
  const [generating, setGenerating] = useState<string | null>(null)
  const navigate = useNavigate()

  const fetchReports = async () => {
    try {
      setLoading(true)
      const response = await reportsAPI.getReports()
      setReports(response.data.reports)
    } catch (error) {
      toast.error('Failed to load reports')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateReport = async (reportId: string) => {
    try {
      setGenerating(reportId)
      const response = await reportsAPI.generatePDF({ reportId })
      
      if (response.data.success) {
        const reportData = response.data.reportData
        const pdfContent = generatePDFContent(reportData.title, reportData)
        const filename = `report-${reportId}-${new Date().toISOString().split('T')[0]}.pdf`
        
        downloadPDF(pdfContent, filename)
        toast.success('Report generated and downloaded successfully')
      }
    } catch (error) {
      toast.error('Failed to generate report')
    } finally {
      setGenerating(null)
    }
  }

  const filteredReports = selectedType === 'All' 
    ? reports 
    : reports.filter(report => report.type === selectedType)

  useEffect(() => {
    fetchReports()
  }, [])

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="text-center">
          <FileText className="w-12 h-12 mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading reports...</p>
        </div>
      </div>
    )
  }

  const reportTypes = ['All', 'Revenue', 'Analytics', 'Growth', 'Annual']

  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Reports</h1>
            <p className="text-muted-foreground mt-2">
              Generate and manage your business reports
            </p>
          </div>
          <Button>
            <FileText className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </motion.div>

      {/* Report Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">
              Generated this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              Automated reports
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Downloads</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Generation</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.3s</div>
            <p className="text-xs text-muted-foreground">
              Processing time
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Data Source Connection Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Link2 className="h-5 w-5" />
              <span>Data Source Connection</span>
            </CardTitle>
            <CardDescription>
              Connect your data sources to see real-time revenue trends and customer growth
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Revenue Trends</h4>
                    <p className="text-sm text-muted-foreground">Monthly recurring revenue over the last 12 months</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">Not Connected</Badge>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => navigate('/settings?tab=integrations')}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Connect Stripe
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Customer Growth</h4>
                    <p className="text-sm text-muted-foreground">New customer acquisition over time</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">Not Connected</Badge>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => navigate('/settings?tab=integrations')}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Connect Analytics
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Revenue Trends Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Revenue Trends</span>
            </CardTitle>
            <CardDescription>
              Monthly recurring revenue over the last 12 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
              <div className="text-center space-y-4">
                <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                  <BarChart3 className="h-8 w-8 text-gray-500" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">Revenue chart will be displayed here</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Connect to your data source to see revenue trends
                  </p>
                </div>
                <Button onClick={() => navigate('/settings?tab=integrations')}>
                  <Settings className="h-4 w-4 mr-2" />
                  Connect Data Source
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Customer Growth Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Customer Growth</span>
            </CardTitle>
            <CardDescription>
              New customer acquisition over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
              <div className="text-center space-y-4">
                <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                  <BarChart3 className="h-8 w-8 text-gray-500" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">Growth chart will be displayed here</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Connect to your data source to see customer growth
                  </p>
                </div>
                <Button>
                  <Link2 className="h-4 w-4 mr-2" />
                  Connect Data Source
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Report Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="flex flex-wrap gap-2"
      >
        {reportTypes.map((type) => (
          <Button
            key={type}
            variant={selectedType === type ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedType(type)}
          >
            {type}
          </Button>
        ))}
      </motion.div>

      {/* Reports List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="space-y-4"
      >
        {filteredReports.map((report) => (
          <Card key={report.name}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{report.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {report.description}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">{report.type}</Badge>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleGenerateReport(report.id)}
                    disabled={generating === report.id}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {generating === report.id ? 'Generating...' : 'Download'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="w-4 h-4 mr-1" />
                Last generated: {report.lastGenerated}
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>
    </div>
  )
}
