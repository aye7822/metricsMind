import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Bell, Shield, Database, Palette } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'react-hot-toast'

export function Settings() {
  const [profileData, setProfileData] = useState({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    company: 'Your Company'
  })

  const [notifications, setNotifications] = useState({
    email: true,
    weeklyReports: true,
    systemAlerts: false,
    marketing: false
  })

  const [security, setSecurity] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const [appearance, setAppearance] = useState({
    darkMode: true,
    language: 'English',
    timezone: 'UTC-08:00 (Pacific Time)'
  })

  const handleSaveProfile = () => {
    toast.success('Profile updated successfully')
  }

  const handleSaveNotifications = () => {
    toast.success('Notification preferences saved')
  }

  const handleUpdatePassword = () => {
    if (security.newPassword !== security.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    toast.success('Password updated successfully')
    setSecurity({ currentPassword: '', newPassword: '', confirmPassword: '' })
  }

  const handleSaveAppearance = () => {
    toast.success('Appearance settings saved')
  }

  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your account settings and preferences
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Profile Information
                </CardTitle>
                <CardDescription>
                  Update your personal information and account details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input 
                      id="firstName" 
                      value={profileData.firstName}
                      onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input 
                      id="lastName" 
                      value={profileData.lastName}
                      onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={profileData.email}
                    onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input 
                    id="company" 
                    value={profileData.company}
                    onChange={(e) => setProfileData({...profileData, company: e.target.value})}
                  />
                </div>
                <Button onClick={handleSaveProfile}>Save Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="w-5 h-5 mr-2" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Choose how you want to be notified about important events
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive email notifications for important updates
                    </p>
                  </div>
                  <Switch 
                    checked={notifications.email}
                    onCheckedChange={(checked) => setNotifications({...notifications, email: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Weekly Reports</Label>
                    <p className="text-sm text-muted-foreground">
                      Get weekly performance reports via email
                    </p>
                  </div>
                  <Switch 
                    checked={notifications.weeklyReports}
                    onCheckedChange={(checked) => setNotifications({...notifications, weeklyReports: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>System Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive alerts for system issues and maintenance
                    </p>
                  </div>
                  <Switch 
                    checked={notifications.systemAlerts}
                    onCheckedChange={(checked) => setNotifications({...notifications, systemAlerts: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Marketing Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Get updates about new features and tips
                    </p>
                  </div>
                  <Switch 
                    checked={notifications.marketing}
                    onCheckedChange={(checked) => setNotifications({...notifications, marketing: checked})}
                  />
                </div>
                <Button onClick={handleSaveNotifications}>Save Preferences</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Security Settings
                </CardTitle>
                <CardDescription>
                  Manage your account security and privacy settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input 
                    id="currentPassword" 
                    type="password" 
                    value={security.currentPassword}
                    onChange={(e) => setSecurity({...security, currentPassword: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input 
                    id="newPassword" 
                    type="password" 
                    value={security.newPassword}
                    onChange={(e) => setSecurity({...security, newPassword: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input 
                    id="confirmPassword" 
                    type="password" 
                    value={security.confirmPassword}
                    onChange={(e) => setSecurity({...security, confirmPassword: e.target.value})}
                  />
                </div>
                <Button onClick={handleUpdatePassword}>Update Password</Button>
                
                <div className="border-t pt-6">
                  <h4 className="text-sm font-medium mb-4">Two-Factor Authentication</h4>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable 2FA</Label>
                      <p className="text-sm text-muted-foreground">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <Button variant="outline">Setup 2FA</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="w-5 h-5 mr-2" />
                  Data Integrations
                </CardTitle>
                <CardDescription>
                  Connect your data sources to get real-time insights
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Stripe</CardTitle>
                      <CardDescription>Payment processing data</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="outline" className="w-full">
                        Connect Stripe
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Google Analytics</CardTitle>
                      <CardDescription>Website traffic data</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="outline" className="w-full">
                        Connect Analytics
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Palette className="w-5 h-5 mr-2" />
                  Appearance Settings
                </CardTitle>
                <CardDescription>
                  Customize the look and feel of your dashboard
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Dark Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Switch between light and dark themes
                    </p>
                  </div>
                  <Switch 
                    checked={appearance.darkMode}
                    onCheckedChange={(checked) => setAppearance({...appearance, darkMode: checked})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Language</Label>
                  <select 
                    className="w-full p-2 border rounded-md"
                    value={appearance.language}
                    onChange={(e) => setAppearance({...appearance, language: e.target.value})}
                  >
                    <option value="English">English</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                    <option value="German">German</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Time Zone</Label>
                  <select 
                    className="w-full p-2 border rounded-md"
                    value={appearance.timezone}
                    onChange={(e) => setAppearance({...appearance, timezone: e.target.value})}
                  >
                    <option value="UTC-08:00 (Pacific Time)">UTC-08:00 (Pacific Time)</option>
                    <option value="UTC-05:00 (Eastern Time)">UTC-05:00 (Eastern Time)</option>
                    <option value="UTC+00:00 (GMT)">UTC+00:00 (GMT)</option>
                    <option value="UTC+01:00 (Central European Time)">UTC+01:00 (Central European Time)</option>
                  </select>
                </div>
                <Button onClick={handleSaveAppearance}>Save Preferences</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}
