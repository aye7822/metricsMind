import type { ComponentType } from 'react'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Link2, CheckCircle, AlertCircle, Clock, ExternalLink, RefreshCw, Shield,
  CreditCard, BarChart3, Database, Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { toast } from 'react-hot-toast'

interface Integration {
  id: string
  name: string
  description: string
  icon: ComponentType<any>
  status: 'connected' | 'disconnected' | 'error' | 'pending'
  lastSync?: string
  dataTypes: string[]
  category: 'payment' | 'analytics' | 'crm' | 'other'
  setupUrl?: string
}

const integrations: Integration[] = [
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Payment processing data',
    icon: CreditCard,
    status: 'disconnected',
    dataTypes: ['Transactions', 'Revenue', 'Customers', 'Subscriptions'],
    category: 'payment',
    setupUrl: 'https://stripe.com/connect'
  },
  {
    id: 'google-analytics',
    name: 'Google Analytics',
    description: 'Website traffic data',
    icon: BarChart3,
    status: 'disconnected',
    dataTypes: ['Page Views', 'Sessions', 'User Behavior', 'Conversion'],
    category: 'analytics',
    setupUrl: 'https://analytics.google.com'
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'CRM and marketing automation',
    icon: Database,
    status: 'disconnected',
    dataTypes: ['Contacts', 'Deals', 'Marketing Campaigns', 'Sales Pipeline'],
    category: 'crm'
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    description: 'Customer relationship management',
    icon: Database,
    status: 'disconnected',
    dataTypes: ['Leads', 'Opportunities', 'Accounts', 'Activities'],
    category: 'crm'
  },
  {
    id: 'mailchimp',
    name: 'Mailchimp',
    description: 'Email marketing campaigns',
    icon: Zap,
    status: 'disconnected',
    dataTypes: ['Subscribers', 'Campaigns', 'Open Rates', 'Click Rates'],
    category: 'other'
  },
  {
    id: 'shopify',
    name: 'Shopify',
    description: 'E-commerce platform data',
    icon: CreditCard,
    status: 'disconnected',
    dataTypes: ['Orders', 'Products', 'Customers', 'Revenue'],
    category: 'payment'
  }
]

const statusConfig = {
  connected: { 
    label: 'Connected', 
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    icon: CheckCircle
  },
  disconnected: { 
    label: 'Disconnected', 
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    icon: AlertCircle
  },
  error: { 
    label: 'Error', 
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    icon: AlertCircle
  },
  pending: { 
    label: 'Pending', 
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    icon: Clock
  }
}

export function DataIntegrations() {
  const [integrationsState, setIntegrationsState] = useState<Integration[]>(integrations)
  const [filter, setFilter] = useState<string>('all')
  const [connecting, setConnecting] = useState<string | null>(null)

  const handleConnect = async (integrationId: string) => {
    setConnecting(integrationId)
    
    try {
      // Simulate connection process
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setIntegrationsState(prev => 
        prev.map(integration => 
          integration.id === integrationId 
            ? { 
                ...integration, 
                status: 'connected' as const,
                lastSync: new Date().toISOString()
              }
            : integration
        )
      )
      
      toast.success(`${integrations.find(i => i.id === integrationId)?.name} connected successfully!`)
    } catch (error) {
      setIntegrationsState(prev => 
        prev.map(integration => 
          integration.id === integrationId 
            ? { ...integration, status: 'error' as const }
            : integration
        )
      )
      toast.error('Failed to connect integration')
    } finally {
      setConnecting(null)
    }
  }

  const handleDisconnect = async (integrationId: string) => {
    try {
      setIntegrationsState(prev => 
        prev.map(integration => 
          integration.id === integrationId 
            ? { ...integration, status: 'disconnected' as const, lastSync: undefined }
            : integration
        )
      )
      
      toast.success(`${integrations.find(i => i.id === integrationId)?.name} disconnected successfully!`)
    } catch (error) {
      toast.error('Failed to disconnect integration')
    }
  }

  const handleSync = async (integrationId: string) => {
    try {
      setIntegrationsState(prev => 
        prev.map(integration => 
          integration.id === integrationId 
            ? { ...integration, status: 'pending' as const }
            : integration
        )
      )
      
      // Simulate sync process
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      setIntegrationsState(prev => 
        prev.map(integration => 
          integration.id === integrationId 
            ? { 
                ...integration, 
                status: 'connected' as const,
                lastSync: new Date().toISOString()
              }
            : integration
        )
      )
      
      toast.success('Data synced successfully!')
    } catch (error) {
      setIntegrationsState(prev => 
        prev.map(integration => 
          integration.id === integrationId 
            ? { ...integration, status: 'error' as const }
            : integration
        )
      )
      toast.error('Failed to sync data')
    }
  }

  const filteredIntegrations = filter === 'all' 
    ? integrationsState 
    : integrationsState.filter(integration => integration.category === filter)

  const connectedCount = integrationsState.filter(i => i.status === 'connected').length
  const totalCount = integrationsState.length

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">Data Integrations</h1>
          <p className="text-muted-foreground mt-2">
            Connect your data sources to get real-time insights
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-muted-foreground">
            {connectedCount} of {totalCount} connected
          </div>
          <Button variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Sync All
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Integrations</p>
                <p className="text-2xl font-bold">{totalCount}</p>
              </div>
              <Link2 className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Connected</p>
                <p className="text-2xl font-bold text-green-600">{connectedCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Disconnected</p>
                <p className="text-2xl font-bold text-gray-600">{totalCount - connectedCount}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Last Sync</p>
                <p className="text-sm font-bold">
                  {integrationsState.find(i => i.lastSync)?.lastSync 
                    ? new Date(integrationsState.find(i => i.lastSync)!.lastSync!).toLocaleTimeString()
                    : 'Never'
                  }
                </p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All ({totalCount})
            </Button>
            <Button
              variant={filter === 'payment' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('payment')}
            >
              Payment ({integrationsState.filter(i => i.category === 'payment').length})
            </Button>
            <Button
              variant={filter === 'analytics' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('analytics')}
            >
              Analytics ({integrationsState.filter(i => i.category === 'analytics').length})
            </Button>
            <Button
              variant={filter === 'crm' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('crm')}
            >
              CRM ({integrationsState.filter(i => i.category === 'crm').length})
            </Button>
            <Button
              variant={filter === 'other' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('other')}
            >
              Other ({integrationsState.filter(i => i.category === 'other').length})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredIntegrations.map((integration) => {
          const StatusIcon = statusConfig[integration.status].icon
          const IntegrationIcon = integration.icon
          
          return (
            <motion.div
              key={integration.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <IntegrationIcon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{integration.name}</CardTitle>
                        <CardDescription>{integration.description}</CardDescription>
                      </div>
                    </div>
                    <Badge className={statusConfig[integration.status].color}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusConfig[integration.status].label}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Data Types</Label>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {integration.dataTypes.map((type) => (
                        <Badge key={type} variant="secondary" className="text-xs">
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {integration.lastSync && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Last Sync</Label>
                      <p className="text-sm text-muted-foreground">
                        {new Date(integration.lastSync).toLocaleString()}
                      </p>
                    </div>
                  )}

                  <div className="flex space-x-2">
                    {integration.status === 'connected' ? (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleSync(integration.id)}
                          disabled={connecting === integration.id}
                        >
                          {connecting === integration.id ? (
                            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <RefreshCw className="h-4 w-4 mr-2" />
                          )}
                          Sync
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDisconnect(integration.id)}
                        >
                          Disconnect
                        </Button>
                      </>
                    ) : (
                      <Button 
                        size="sm" 
                        onClick={() => handleConnect(integration.id)}
                        disabled={connecting === integration.id}
                        className="w-full"
                      >
                        {connecting === integration.id ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                            Connecting...
                          </>
                        ) : (
                          <>
                            <Link2 className="h-4 w-4 mr-2" />
                            Connect {integration.name}
                          </>
                        )}
                      </Button>
                    )}
                  </div>

                  {integration.setupUrl && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full"
                      onClick={() => window.open(integration.setupUrl, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Setup Guide
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Security & Privacy</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Data Security</h4>
              <p className="text-sm text-muted-foreground">
                All integrations use secure OAuth 2.0 authentication and encrypted data transmission. 
                We never store your credentials and only access the minimum required data.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Privacy Protection</h4>
              <p className="text-sm text-muted-foreground">
                Your data is processed according to GDPR and CCPA regulations. 
                You can revoke access at any time and request data deletion.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
