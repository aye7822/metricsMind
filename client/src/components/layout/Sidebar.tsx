import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Users,
  CreditCard,
  FileText,
  Settings,
  BarChart3,
  Menu,
  X,
  Link2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface SidebarProps {
  isCollapsed: boolean
  onToggle: () => void
}

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    name: 'Customers',
    href: '/customers',
    icon: Users,
  },
  {
    name: 'Plans',
    href: '/plans',
    icon: CreditCard,
  },
  {
    name: 'Reports',
    href: '/reports',
    icon: FileText,
  },
  {
    name: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
  },
  {
    name: 'Integrations',
    href: '/integrations',
    icon: Link2,
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
  },
]

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const location = useLocation()

  return (
    <motion.div
      initial={false}
      animate={{ width: isCollapsed ? 80 : 256 }}
      className="relative h-full bg-card border-r border-border"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center space-x-2"
          >
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">MetricsMind</span>
          </motion.div>
        )}
        
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="h-8 w-8"
        >
          {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {navigationItems.map((item) => {
          const isActive = location.pathname === item.href
          const Icon = item.icon

          return (
            <div key={item.name} className="relative group">
              <Link
                to={item.href}
                className={cn(
                  "flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground"
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="truncate"
                  >
                    {item.name}
                  </motion.span>
                )}
              </Link>
              
              {/* Tooltip */}
              {isCollapsed && (
                <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 bg-popover text-popover-foreground px-2 py-1 rounded-md text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                  {item.name}
                </div>
              )}
            </div>
          )
        })}
        
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute bottom-4 left-4 right-4"
        >
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground">
              SaaS Metrics Dashboard
            </p>
            <p className="text-xs text-muted-foreground">
              v1.0.0
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
