import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, X, Mail, AlertTriangle, CheckCircle, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  timestamp: string
  read: boolean
}

interface NotificationPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'New Customer Signup',
      message: 'Acme Corp has signed up for the Professional plan',
      type: 'success',
      timestamp: '2 minutes ago',
      read: false
    },
    {
      id: '2',
      title: 'Payment Failed',
      message: 'Payment failed for TechStart Inc. Please follow up.',
      type: 'warning',
      timestamp: '1 hour ago',
      read: false
    },
    {
      id: '3',
      title: 'System Update',
      message: 'Scheduled maintenance completed successfully',
      type: 'info',
      timestamp: '3 hours ago',
      read: true
    },
    {
      id: '4',
      title: 'High Churn Alert',
      message: 'Churn rate has increased by 15% this week',
      type: 'error',
      timestamp: '1 day ago',
      read: true
    }
  ])

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      default:
        return <Info className="h-4 w-4 text-blue-600" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-green-200 bg-green-50'
      case 'warning':
        return 'border-yellow-200 bg-yellow-50'
      case 'error':
        return 'border-red-200 bg-red-50'
      default:
        return 'border-blue-200 bg-blue-50'
    }
  }

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    )
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-40"
            onClick={onClose}
          />
          
          {/* Panel */}
          <motion.div
            initial={{ x: -400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -400, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 h-full w-80 bg-background border-r border-border shadow-lg z-50"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center space-x-2">
                  <Bell className="h-5 w-5" />
                  <h2 className="text-lg font-semibold">Notifications</h2>
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {unreadCount}
                    </Badge>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Actions */}
              <div className="p-4 border-b border-border">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={markAllAsRead}
                  disabled={unreadCount === 0}
                >
                  Mark all as read
                </Button>
              </div>

              {/* Notifications List */}
              <div className="flex-1 overflow-y-auto">
                <div className="space-y-4 p-4">
                  {notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-3 rounded-lg border ${getNotificationColor(notification.type)} ${
                        !notification.read ? 'ring-2 ring-primary/20' : ''
                      }`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-start space-x-3">
                        {getNotificationIcon(notification.type)}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium">{notification.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {notification.timestamp}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1" />
                        )}
                      </div>
                    </motion.div>
                  ))}
                  
                  {notifications.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No notifications</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-border">
                <Button variant="outline" className="w-full" size="sm">
                  <Mail className="h-4 w-4 mr-2" />
                  Email Settings
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
