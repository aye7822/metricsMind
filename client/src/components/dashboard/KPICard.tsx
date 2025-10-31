import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface KPICardProps {
  title: string
  value: number
  growth: number
  icon: LucideIcon
  format: 'currency' | 'percentage' | 'number'
  delay?: number
}

export function KPICard({ title, value, growth, icon: Icon, format, delay = 0 }: KPICardProps) {
  const formatValue = (val: number) => {
    switch (format) {
      case 'currency':
        return `$${val.toLocaleString()}`
      case 'percentage':
        return `${val.toFixed(2)}%`
      default:
        return val.toLocaleString()
    }
  }

  const isPositive = growth >= 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatValue(value)}</div>
          <p className={`text-xs flex items-center ${
            isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            <span className="mr-1">
              {isPositive ? '↗' : '↘'}
            </span>
            {Math.abs(growth).toFixed(1)}% from last month
          </p>
        </CardContent>
      </Card>
    </motion.div>
  )
}