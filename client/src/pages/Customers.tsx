import  { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, Plus, Search, Edit, Trash2, Eye, Download, 
  DollarSign, 
  CheckCircle, XCircle, Clock, AlertCircle, X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { customersAPI } from '@/lib/api'
import { toast } from 'react-hot-toast'
import { downloadCSV } from '@/lib/downloadUtils'

interface Customer {
  id: string
  name: string
  email: string
  phone?: string
  company?: string
  plan: string
  status: 'active' | 'churned' | 'trial' | 'inactive'
  mrr: number
  joinDate: string
  lastActivity: string
  location?: string
  notes?: string
  isFavorite?: boolean
  tags?: string[]
}

const statusConfig = {
  active: { label: 'Active', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', icon: CheckCircle },
  trial: { label: 'Trial', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300', icon: Clock },
  churned: { label: 'Churned', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300', icon: XCircle },
  inactive: { label: 'Inactive', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300', icon: AlertCircle }
}

const planConfig = {
  'Basic': { price: 29, color: 'bg-gray-100 text-gray-800' },
  'Pro': { price: 99, color: 'bg-blue-100 text-blue-800' },
  'Premium': { price: 299, color: 'bg-purple-100 text-purple-800' },
  'Enterprise': { price: 999, color: 'bg-orange-100 text-orange-800' }
}

export function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [planFilter, setPlanFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null)
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    plan: 'Basic',
    status: 'trial' as const,
    location: '',
    notes: ''
  })

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const response = await customersAPI.getCustomers()
      // Ensure status is one of specified enum values (type narrowing/coercion)
      setCustomers(
        response.data.map((c: any) => ({
          ...c,
          status: 
            c.status === "active" ||
            c.status === "trial" ||
            c.status === "churned" ||
            c.status === "inactive"
              ? c.status
              : "inactive"
        }))
      )
    } catch (error) {
      toast.error('Failed to fetch customers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  useEffect(() => {
    filterAndSortCustomers()
  }, [customers, searchTerm, statusFilter, planFilter, sortBy, sortOrder])

  const filterAndSortCustomers = () => {
    let filtered = customers.filter(customer => {
      const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           customer.company?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || customer.status === statusFilter
      const matchesPlan = planFilter === 'all' || customer.plan === planFilter
      
      return matchesSearch && matchesStatus && matchesPlan
    })

    filtered.sort((a, b) => {
      let aValue = a[sortBy as keyof Customer]
      let bValue = b[sortBy as keyof Customer]
      
      if (sortBy === 'mrr') {
        aValue = a.mrr
        bValue = b.mrr
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue
      }
      
      return 0
    })

    setFilteredCustomers(filtered)
  }

  const handleAddCustomer = async () => {
    try {
      await customersAPI.addCustomer(newCustomer)
      toast.success('Customer added successfully')
      setShowAddModal(false)
      setNewCustomer({
        name: '',
        email: '',
        phone: '',
        company: '',
        plan: 'Basic',
        status: 'trial',
        location: '',
        notes: ''
      })
      fetchCustomers()
    } catch (error) {
      toast.error('Failed to add customer')
    }
  }

  const handleEditCustomer = async () => {
    if (!currentCustomer) return
    
    try {
      await customersAPI.updateCustomer(currentCustomer.id, currentCustomer)
      toast.success('Customer updated successfully')
      setShowEditModal(false)
      setCurrentCustomer(null)
      fetchCustomers()
    } catch (error) {
      toast.error('Failed to update customer')
    }
  }

  const handleDeleteCustomer = async () => {
    if (!currentCustomer) return
    
    try {
      await customersAPI.deleteCustomer(currentCustomer.id)
      toast.success('Customer deleted successfully')
      setShowDeleteModal(false)
      setCurrentCustomer(null)
      fetchCustomers()
    } catch (error) {
      toast.error('Failed to delete customer')
    }
  }

  const handleBulkDelete = async () => {
    try {
      for (const customerId of selectedCustomers) {
        await customersAPI.deleteCustomer(customerId)
      }
      toast.success(`${selectedCustomers.length} customers deleted successfully`)
      setSelectedCustomers([])
      fetchCustomers()
    } catch (error) {
      toast.error('Failed to delete customers')
    }
  }

  const handleExportCustomers = () => {
    const csvData = filteredCustomers.map(customer => ({
      Name: customer.name,
      Email: customer.email,
      Phone: customer.phone || '',
      Company: customer.company || '',
      Plan: customer.plan,
      Status: customer.status,
      MRR: customer.mrr,
      'Join Date': customer.joinDate,
      'Last Activity': customer.lastActivity,
      Location: customer.location || '',
      Notes: customer.notes || ''
    }))
    
    downloadCSV(csvData, `customers-export-${new Date().toISOString().split('T')[0]}.csv`)
    toast.success('Customers exported successfully')
  }

  const toggleCustomerSelection = (customerId: string) => {
    setSelectedCustomers(prev => 
      prev.includes(customerId) 
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    )
  }

  const selectAllCustomers = () => {
    setSelectedCustomers(
      selectedCustomers.length === filteredCustomers.length 
        ? [] 
        : filteredCustomers.map(c => c.id)
    )
  }

  const getCustomerStats = () => {
    const total = customers.length
    const active = customers.filter(c => c.status === 'active').length
    const trial = customers.filter(c => c.status === 'trial').length
    const churned = customers.filter(c => c.status === 'churned').length
    const totalMRR = customers.reduce((sum, c) => sum + c.mrr, 0)
    
    return { total, active, trial, churned, totalMRR }
  }

  const stats = getCustomerStats()

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

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
          <h1 className="text-3xl font-bold text-foreground">Customers</h1>
          <p className="text-muted-foreground mt-2">
            Manage your customer relationships and track their engagement
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleExportCustomers}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Customer
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Customers</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Trial</p>
                <p className="text-2xl font-bold text-blue-600">{stats.trial}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Churned</p>
                <p className="text-2xl font-bold text-red-600">{stats.churned}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total MRR</p>
                <p className="text-2xl font-bold">${stats.totalMRR.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-input rounded-md bg-background text-sm"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="trial">Trial</option>
                <option value="churned">Churned</option>
                <option value="inactive">Inactive</option>
              </select>
              
              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                className="px-3 py-2 border border-input rounded-md bg-background text-sm"
              >
                <option value="all">All Plans</option>
                <option value="Basic">Basic</option>
                <option value="Pro">Pro</option>
                <option value="Premium">Premium</option>
                <option value="Enterprise">Enterprise</option>
              </select>
              
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-')
                  setSortBy(field)
                  setSortOrder(order as 'asc' | 'desc')
                }}
                className="px-3 py-2 border border-input rounded-md bg-background text-sm"
              >
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
                <option value="mrr-desc">MRR High-Low</option>
                <option value="mrr-asc">MRR Low-High</option>
                <option value="joinDate-desc">Newest First</option>
                <option value="joinDate-asc">Oldest First</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedCustomers.length > 0 && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedCustomers.length} customer(s) selected
              </span>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedCustomers([])}>
                  Clear Selection
                </Button>
                <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Selected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Customer List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Customer List</CardTitle>
              <CardDescription>
                {filteredCustomers.length} customer(s) found
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="select-all" className="text-sm">Select All</Label>
              <Switch
                id="select-all"
                checked={selectedCustomers.length === filteredCustomers.length && filteredCustomers.length > 0}
                onCheckedChange={selectAllCustomers}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr className="text-left">
                  <th className="p-4 font-medium">Customer</th>
                  <th className="p-4 font-medium">Plan</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">MRR</th>
                  <th className="p-4 font-medium">Join Date</th>
                  <th className="p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => {
                  const StatusIcon = statusConfig[customer.status].icon
                  return (
                    <tr key={customer.id} className="border-b hover:bg-muted/50">
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={selectedCustomers.includes(customer.id)}
                            onChange={() => toggleCustomerSelection(customer.id)}
                            className="rounded border-gray-300"
                          />
                          <div>
                            <div className="font-medium">{customer.name}</div>
                            <div className="text-sm text-muted-foreground">{customer.email}</div>
                            {customer.company && (
                              <div className="text-sm text-muted-foreground">{customer.company}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge className={planConfig[customer.plan as keyof typeof planConfig]?.color || 'bg-gray-100 text-gray-800'}>
                          {customer.plan}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <StatusIcon className="h-4 w-4" />
                          <Badge className={statusConfig[customer.status].color}>
                            {statusConfig[customer.status].label}
                          </Badge>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium">${customer.mrr.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">monthly</div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">{new Date(customer.joinDate).toLocaleDateString()}</div>
                        <div className="text-sm text-muted-foreground">
                          {Math.floor((Date.now() - new Date(customer.joinDate).getTime()) / (1000 * 60 * 60 * 24))} days ago
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setCurrentCustomer(customer)
                              setShowViewModal(true)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setCurrentCustomer(customer)
                              setShowEditModal(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setCurrentCustomer(customer)
                              setShowDeleteModal(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-background p-6 rounded-lg shadow-lg w-full max-w-md mx-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add New Customer</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowAddModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  placeholder="Enter customer name"
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  placeholder="Enter email address"
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  placeholder="Enter phone number"
                />
              </div>
              
              <div>
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={newCustomer.company}
                  onChange={(e) => setNewCustomer({ ...newCustomer, company: e.target.value })}
                  placeholder="Enter company name"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="plan">Plan</Label>
                  <select
                    id="plan"
                    value={newCustomer.plan}
                    onChange={(e) => setNewCustomer({ ...newCustomer, plan: e.target.value })}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                  >
                    <option value="Basic">Basic</option>
                    <option value="Pro">Pro</option>
                    <option value="Premium">Premium</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    value={newCustomer.status}
                    onChange={(e) => setNewCustomer({ ...newCustomer, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                  >
                    <option value="trial">Trial</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={newCustomer.location}
                  onChange={(e) => setNewCustomer({ ...newCustomer, location: e.target.value })}
                  placeholder="Enter location"
                />
              </div>
              
              <div>
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  value={newCustomer.notes}
                  onChange={(e) => setNewCustomer({ ...newCustomer, notes: e.target.value })}
                  placeholder="Enter notes"
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm min-h-[80px]"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddCustomer}>
                Add Customer
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* View Customer Modal */}
      {showViewModal && currentCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-background p-6 rounded-lg shadow-lg w-full max-w-lg mx-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Customer Details</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowViewModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                  <p className="text-sm">{currentCustomer.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                  <p className="text-sm">{currentCustomer.email}</p>
                </div>
              </div>
              
              {currentCustomer.phone && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                    <p className="text-sm">{currentCustomer.phone}</p>
                  </div>
                  {currentCustomer.company && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Company</Label>
                      <p className="text-sm">{currentCustomer.company}</p>
                    </div>
                  )}
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Plan</Label>
                  <Badge className={planConfig[currentCustomer.plan as keyof typeof planConfig]?.color || 'bg-gray-100 text-gray-800'}>
                    {currentCustomer.plan}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <Badge className={statusConfig[currentCustomer.status].color}>
                    {statusConfig[currentCustomer.status].label}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">MRR</Label>
                  <p className="text-sm font-semibold">${currentCustomer.mrr.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Join Date</Label>
                  <p className="text-sm">{new Date(currentCustomer.joinDate).toLocaleDateString()}</p>
                </div>
              </div>
              
              {currentCustomer.location && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Location</Label>
                  <p className="text-sm">{currentCustomer.location}</p>
                </div>
              )}
              
              {currentCustomer.notes && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Notes</Label>
                  <p className="text-sm">{currentCustomer.notes}</p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setShowViewModal(false)}>
                Close
              </Button>
              <Button onClick={() => {
                setShowViewModal(false)
                setShowEditModal(true)
              }}>
                Edit Customer
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {showEditModal && currentCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-background p-6 rounded-lg shadow-lg w-full max-w-md mx-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Edit Customer</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowEditModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={currentCustomer.name}
                  onChange={(e) => setCurrentCustomer({ ...currentCustomer, name: e.target.value })}
                  placeholder="Enter customer name"
                />
              </div>
              
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={currentCustomer.email}
                  onChange={(e) => setCurrentCustomer({ ...currentCustomer, email: e.target.value })}
                  placeholder="Enter email address"
                />
              </div>
              
              <div>
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={currentCustomer.phone || ''}
                  onChange={(e) => setCurrentCustomer({ ...currentCustomer, phone: e.target.value })}
                  placeholder="Enter phone number"
                />
              </div>
              
              <div>
                <Label htmlFor="edit-company">Company</Label>
                <Input
                  id="edit-company"
                  value={currentCustomer.company || ''}
                  onChange={(e) => setCurrentCustomer({ ...currentCustomer, company: e.target.value })}
                  placeholder="Enter company name"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-plan">Plan</Label>
                  <select
                    id="edit-plan"
                    value={currentCustomer.plan}
                    onChange={(e) => setCurrentCustomer({ ...currentCustomer, plan: e.target.value })}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                  >
                    <option value="Basic">Basic</option>
                    <option value="Pro">Pro</option>
                    <option value="Premium">Premium</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="edit-status">Status</Label>
                  <select
                    id="edit-status"
                    value={currentCustomer.status}
                    onChange={(e) => setCurrentCustomer({ ...currentCustomer, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                  >
                    <option value="trial">Trial</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="churned">Churned</option>
                  </select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="edit-location">Location</Label>
                <Input
                  id="edit-location"
                  value={currentCustomer.location || ''}
                  onChange={(e) => setCurrentCustomer({ ...currentCustomer, location: e.target.value })}
                  placeholder="Enter location"
                />
              </div>
              
              <div>
                <Label htmlFor="edit-notes">Notes</Label>
                <textarea
                  id="edit-notes"
                  value={currentCustomer.notes || ''}
                  onChange={(e) => setCurrentCustomer({ ...currentCustomer, notes: e.target.value })}
                  placeholder="Enter notes"
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm min-h-[80px]"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditCustomer}>
                Update Customer
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && currentCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-background p-6 rounded-lg shadow-lg w-full max-w-md mx-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-red-600">Delete Customer</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowDeleteModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete <strong>{currentCustomer.name}</strong>? 
                This action cannot be undone.
              </p>
              
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <span className="text-sm font-medium text-red-800 dark:text-red-300">
                    Warning: This will permanently delete all customer data.
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteCustomer}>
                Delete Customer
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}