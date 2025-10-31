import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CreditCard, Plus, Check, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { plansAPI } from '@/lib/api'
import { toast } from 'react-hot-toast'

interface Plan {
  id: string
  name: string
  price: number
  period: string
  description: string
  features: string[]
  isPopular: boolean
  customerCount: number
  revenue: number
}

export function Plans() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newPlan, setNewPlan] = useState({
    name: '',
    price: 0,
    period: 'month',
    description: '',
    features: ['']
  })

  const fetchPlans = async () => {
    try {
      setLoading(true)
      const response = await plansAPI.getPlans()
      setPlans(response.data.plans)
    } catch (error) {
      toast.error('Failed to load plans')
    } finally {
      setLoading(false)
    }
  }

  const handleAddPlan = async () => {
    try {
      await plansAPI.createPlan(newPlan)
      toast.success('Plan created successfully')
      setShowAddModal(false)
      setNewPlan({ name: '', price: 0, period: 'month', description: '', features: [''] })
      fetchPlans()
    } catch (error) {
      toast.error('Failed to create plan')
    }
  }

  const handleDeletePlan = async (id: string) => {
    if (confirm('Are you sure you want to delete this plan?')) {
      try {
        await plansAPI.deletePlan(id)
        toast.success('Plan deleted successfully')
        fetchPlans()
      } catch (error) {
        toast.error('Failed to delete plan')
      }
    }
  }

  useEffect(() => {
    fetchPlans()
  }, [])

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="text-center">
          <CreditCard className="w-12 h-12 mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading plans...</p>
        </div>
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
            <h1 className="text-3xl font-bold text-foreground">Plans</h1>
            <p className="text-muted-foreground mt-2">
              Manage your subscription plans and pricing
            </p>
          </div>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Plan
          </Button>
        </div>
      </motion.div>

      {/* Plan Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Plans</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              Active subscription plans
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Popular</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Professional</div>
            <p className="text-xs text-muted-foreground">
              65% of customers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Revenue</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$47</div>
            <p className="text-xs text-muted-foreground">
              Per customer per month
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Plans Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {plans.map((plan) => (
          <Card key={plan.name} className={`relative ${plan.isPopular ? 'ring-2 ring-primary' : ''}`}>
            {plan.isPopular && (
              <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                Most Popular
              </Badge>
            )}
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <div className="flex items-baseline justify-center">
                <span className="text-3xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground">{plan.period}</span>
              </div>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center">
                    <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="space-y-2">
                <Button 
                  className="w-full" 
                  variant={plan.isPopular ? 'default' : 'outline'}
                >
                  {plan.name === 'Enterprise' ? 'Contact Sales' : 'Choose Plan'}
                </Button>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDeletePlan(plan.id)}
                    className="flex-1"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Add Plan Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-background p-6 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto"
          >
            <h3 className="text-lg font-semibold mb-4">Create New Plan</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Plan Name</label>
                <input
                  type="text"
                  value={newPlan.name}
                  onChange={(e) => setNewPlan({...newPlan, name: e.target.value})}
                  placeholder="Plan name"
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Price</label>
                <input
                  type="number"
                  value={newPlan.price}
                  onChange={(e) => setNewPlan({...newPlan, price: Number(e.target.value)})}
                  placeholder="99"
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Period</label>
                <select
                  value={newPlan.period}
                  onChange={(e) => setNewPlan({...newPlan, period: e.target.value})}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="month">Monthly</option>
                  <option value="year">Yearly</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <input
                  type="text"
                  value={newPlan.description}
                  onChange={(e) => setNewPlan({...newPlan, description: e.target.value})}
                  placeholder="Plan description"
                  className="w-full p-2 border rounded-md"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Features (one per line)</label>
                <textarea
                  value={newPlan.features.join('\n')}
                  onChange={(e) => setNewPlan({...newPlan, features: e.target.value.split('\n')})}
                  placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                  className="w-full p-2 border rounded-md h-24"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddPlan}>
                Create Plan
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
