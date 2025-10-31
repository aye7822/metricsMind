import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface CustomerGrowthChartProps {
  data: Array<{
    month: string
    total: number
    active: number
    churned: number
  }>
}

export function CustomerGrowthChart({ data }: CustomerGrowthChartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.3 }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Customer Growth</CardTitle>
          <CardDescription>Total and active customers over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    value.toLocaleString(), 
                    name === 'total' ? 'Total Customers' : 
                    name === 'active' ? 'Active Customers' : 'Churned Customers'
                  ]}
                  labelFormatter={(label) => `Month: ${label}`}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stackId="1"
                  stroke="hsl(var(--primary))" 
                  fill="hsl(var(--primary))"
                  fillOpacity={0.6}
                />
                <Area 
                  type="monotone" 
                  dataKey="active" 
                  stackId="2"
                  stroke="hsl(var(--secondary))" 
                  fill="hsl(var(--secondary))"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}