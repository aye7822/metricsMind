import axios from 'axios'

/**
 * Extend ImportMeta interface to include 'env' for TypeScript type safety.
 * This fixes the error: "Property 'env' does not exist on type 'ImportMeta'."
 */
interface ImportMeta {
  readonly env: {
    readonly VITE_API_URL?: string
    // You can add other env vars here as needed
  }
}

const API_BASE_URL = (import.meta as unknown as ImportMeta).env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Dummy data generators
const generateDummyMetrics = () => ({
  current: {
    mrr: { current: 125000, growth: 12.5 },
    arr: { current: 1500000, growth: 15.2 },
    churn: { current: 3.2, growth: -0.8 },
    ltv: { current: 4500, growth: 8.3 },
    cac: { current: 1200, growth: -5.2 }
  }
})

const generateDummyHistoricalData = (months: number) => {
  const data = []
  const currentDate = new Date()
  
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(currentDate)
    date.setMonth(date.getMonth() - i)
    
    const month = date.toLocaleDateString('en-US', { month: 'short' })
    const baseMRR = 100000 + (i * 2000)
    const baseChurn = 4.5 - (i * 0.1)
    const baseLTV = 4000 + (i * 50)
    const baseCAC = 1300 - (i * 10)
    
    data.push({
      month,
      mrr: baseMRR + Math.random() * 5000,
      arr: (baseMRR + Math.random() * 5000) * 12,
      churn: Math.max(1, baseChurn + Math.random() * 2 - 1),
      ltv: baseLTV + Math.random() * 500,
      cac: Math.max(800, baseCAC + Math.random() * 200 - 100)
    })
  }
  
  return { historicalData: data }
}

const generateDummyCustomerGrowth = (months: number) => {
  const data = []
  const currentDate = new Date()
  
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(currentDate)
    date.setMonth(date.getMonth() - i)
    
    const month = date.toLocaleDateString('en-US', { month: 'short' })
    const baseTotal = 1200 + (i * 50)
    const baseActive = baseTotal * (0.85 + Math.random() * 0.1)
    const baseChurned = baseTotal * (0.02 + Math.random() * 0.02)
    
    data.push({
      month,
      total: Math.round(baseTotal + Math.random() * 100),
      active: Math.round(baseActive + Math.random() * 50),
      churned: Math.round(baseChurned + Math.random() * 20)
    })
  }
  
  return { customerGrowth: data }
}

const generateDummyCustomers = () => [
  {
    id: '1',
    name: 'Acme Corp',
    email: 'contact@acmecorp.com',
    plan: 'Professional',
    status: 'active',
    mrr: 299,
    joinDate: '2023-01-15',
    lastActivity: '2024-01-10'
  },
  {
    id: '2',
    name: 'TechStart Inc',
    email: 'hello@techstart.com',
    plan: 'Basic',
    status: 'active',
    mrr: 99,
    joinDate: '2023-03-22',
    lastActivity: '2024-01-09'
  },
  {
    id: '3',
    name: 'Enterprise Solutions',
    email: 'admin@enterprise.com',
    plan: 'Enterprise',
    status: 'active',
    mrr: 999,
    joinDate: '2022-11-08',
    lastActivity: '2024-01-11'
  },
  {
    id: '4',
    name: 'SmallBiz LLC',
    email: 'owner@smallbiz.com',
    plan: 'Basic',
    status: 'churned',
    mrr: 0,
    joinDate: '2023-06-10',
    lastActivity: '2023-12-15'
  },
  {
    id: '5',
    name: 'Innovation Hub',
    email: 'team@innovation.com',
    plan: 'Professional',
    status: 'active',
    mrr: 299,
    joinDate: '2023-08-30',
    lastActivity: '2024-01-12'
  }
]

const generateDummyPlans = () => [
  {
    id: '1',
    name: 'Basic',
    price: 99,
    period: 'month',
    description: 'Perfect for small businesses',
    features: ['Up to 1,000 customers', 'Basic analytics', 'Email support'],
    isPopular: false,
    customerCount: 45,
    revenue: 4455
  },
  {
    id: '2',
    name: 'Professional',
    price: 299,
    period: 'month',
    description: 'Best for growing businesses',
    features: ['Up to 10,000 customers', 'Advanced analytics', 'Priority support', 'Custom reports'],
    isPopular: true,
    customerCount: 128,
    revenue: 38272
  },
  {
    id: '3',
    name: 'Enterprise',
    price: 999,
    period: 'month',
    description: 'For large organizations',
    features: ['Unlimited customers', 'Advanced analytics', '24/7 support', 'Custom integrations', 'Dedicated account manager'],
    isPopular: false,
    customerCount: 23,
    revenue: 22977
  }
]

// API services
export const metricsAPI = {
  getMetrics: async () => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))
    return { data: generateDummyMetrics() }
  },
  
  getHistoricalData: async (months: number) => {
    await new Promise(resolve => setTimeout(resolve, 300))
    return { data: generateDummyHistoricalData(months) }
  },
  
  getCustomerGrowth: async (months: number) => {
    await new Promise(resolve => setTimeout(resolve, 300))
    return { data: generateDummyCustomerGrowth(months) }
  },
  
  refreshMetrics: async () => {
    await new Promise(resolve => setTimeout(resolve, 1000))
    return { data: { success: true } }
  },

  exportData: async (format: 'csv' | 'json' | 'pdf') => {
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const exportData = {
      metrics: generateDummyMetrics().current,
      historicalData: generateDummyHistoricalData(12).historicalData,
      customerGrowth: generateDummyCustomerGrowth(12).customerGrowth,
      customers: generateDummyCustomers(),
      plans: generateDummyPlans(),
      exportedAt: new Date().toISOString()
    }
    
    return { data: { exportData, format, success: true } }
  }
}

export const customersAPI = {
  getCustomers: async () => {
    await new Promise(resolve => setTimeout(resolve, 400))
    return { data: generateDummyCustomers() }
  },
  
  addCustomer: async (customerData: any) => {
    await new Promise(resolve => setTimeout(resolve, 600))
    
    // Simulate adding customer with generated data
    const newCustomer = {
      id: Date.now().toString(),
      name: customerData.name,
      email: customerData.email,
      phone: customerData.phone || '',
      company: customerData.company || '',
      plan: customerData.plan,
      status: customerData.status,
      mrr: Math.floor(Math.random() * 1000) + 100,
      joinDate: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      location: customerData.location || '',
      notes: customerData.notes || '',
      isFavorite: false,
      tags: []
    }
    
    return { data: newCustomer }
  },
  
  createCustomer: async (customerData: any) => {
    await new Promise(resolve => setTimeout(resolve, 600))
    return { 
      data: { 
        customer: { 
          ...customerData, 
          id: Date.now().toString(),
          joinDate: new Date().toISOString().split('T')[0],
          status: 'active'
        } 
      } 
    }
  },
  
  updateCustomer: async (id: string, customerData: any) => {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Simulate updating customer
    const updatedCustomer = {
      ...customerData,
      id,
      lastActivity: new Date().toISOString()
    }
    
    return { data: updatedCustomer }
  },
  
  deleteCustomer: async (_id: string) => {
    await new Promise(resolve => setTimeout(resolve, 400))
    return { data: { success: true } }
  },
  
  getCustomerById: async (id: string) => {
    await new Promise(resolve => setTimeout(resolve, 300))
    const customers = generateDummyCustomers()
    const customer = customers.find(c => c.id === id)
    return { data: customer }
  },
  
  exportCustomers: async (_filters: any = {}) => {
    await new Promise(resolve => setTimeout(resolve, 800))
    return { data: generateDummyCustomers() }
  }
}

export const plansAPI = {
  getPlans: async () => {
    await new Promise(resolve => setTimeout(resolve, 300))
    return { data: { plans: generateDummyPlans() } }
  },
  
  createPlan: async (planData: any) => {
    await new Promise(resolve => setTimeout(resolve, 600))
    return { 
      data: { 
        plan: { 
          ...planData, 
          id: Date.now().toString(),
          customerCount: 0,
          revenue: 0
        } 
      } 
    }
  },
  
  updatePlan: async (id: string, planData: any) => {
    await new Promise(resolve => setTimeout(resolve, 500))
    return { data: { plan: { ...planData, id } } }
  },
  
  deletePlan: async (_id: string) => {
    await new Promise(resolve => setTimeout(resolve, 400))
    return { data: { success: true } }
  }
}

export const reportsAPI = {
  generatePDF: async (params: any) => {
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Generate report data
    const reportData = {
      title: `Report - ${params.reportId || 'General'}`,
      generatedAt: new Date().toISOString(),
      metrics: {
        mrr: 125000,
        churn: 3.2,
        ltv: 4500,
        cac: 1200
      },
      summary: 'This is a comprehensive business report with key metrics and insights.',
      recommendations: [
        'Focus on customer retention strategies',
        'Optimize customer acquisition channels',
        'Monitor churn rate closely'
      ]
    }
    
    return { data: { reportData, success: true } }
  },
  
  getReports: async () => {
    await new Promise(resolve => setTimeout(resolve, 400))
    const reports = [
      {
        id: '1',
        name: 'Monthly Revenue Report',
        description: 'Comprehensive revenue analysis for the current month',
        type: 'Revenue',
        lastGenerated: '2 hours ago',
        status: 'ready'
      },
      {
        id: '2',
        name: 'Customer Churn Analysis',
        description: 'Detailed analysis of customer churn patterns and trends',
        type: 'Analytics',
        lastGenerated: '1 day ago',
        status: 'ready'
      },
      {
        id: '3',
        name: 'Growth Metrics Summary',
        description: 'Key growth indicators and performance metrics',
        type: 'Growth',
        lastGenerated: '3 days ago',
        status: 'ready'
      }
    ]
    return { data: { reports } }
  }
}

export const authAPI = {
  login: async (credentials: { email: string; password: string }) => {
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // Simulate authentication - accept any email/password for demo
    const token = 'dummy-jwt-token-' + Date.now()
    const userData = {
      id: '1',
      email: credentials.email,
      name: credentials.email.split('@')[0],
      role: 'admin',
      company: 'Demo Company',
      createdAt: new Date().toISOString()
    }
    
    return {
      data: {
        token,
        user: userData
      }
    }
  },
  
  register: async (userData: { name: string; email: string; password: string; company?: string }) => {
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const token = 'dummy-jwt-token-' + Date.now()
    const newUser = {
      id: Date.now().toString(),
      email: userData.email,
      name: userData.name,
      role: 'user',
      company: userData.company || 'Demo Company',
      createdAt: new Date().toISOString()
    }
    
    return {
      data: {
        token,
        user: newUser
      }
    }
  },
  
  getMe: async () => {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Return current user from localStorage or create a default one
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      return {
        data: {
          user: JSON.parse(savedUser)
        }
      }
    }
    
    // Default user if none exists
    return {
      data: {
        user: {
          id: '1',
          email: 'demo@example.com',
          name: 'Demo User',
          role: 'admin',
          company: 'Demo Company',
          createdAt: new Date().toISOString()
        }
      }
    }
  },
  
  updateProfile: async (data: { name?: string; company?: string }) => {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const savedUser = localStorage.getItem('user')
    const currentUser = savedUser ? JSON.parse(savedUser) : {
      id: '1',
      email: 'demo@example.com',
      name: 'Demo User',
      role: 'admin',
      company: 'Demo Company',
      createdAt: new Date().toISOString()
    }
    
    const updatedUser = { ...currentUser, ...data }
    return {
      data: {
        user: updatedUser
      }
    }
  },
  
  changePassword: async (_data: { currentPassword: string; newPassword: string }) => {
    await new Promise(resolve => setTimeout(resolve, 500))
    return { data: { success: true } }
  },
  
  logout: async () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    return { data: { success: true } }
  }
}

export default api