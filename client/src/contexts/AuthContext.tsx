import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { authAPI } from '@/lib/api'

interface User {
  id: string
  name: string
  email: string
  company?: string
  role: string
  lastLogin?: string
  createdAt: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string, company?: string) => Promise<void>
  logout: () => void
  updateProfile: (data: { name?: string; company?: string }) => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token')
      const savedUser = localStorage.getItem('user')
      
      if (token && savedUser) {
        try {
          const response = await authAPI.getMe()
          setUser(response.data.user)
        } catch (error) {
          console.error('Auth check failed:', error)
          localStorage.removeItem('token')
          localStorage.removeItem('user')
        }
      }
      setLoading(false)
    }

    initAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login({ email, password })
      const { token, user: userData } = response.data
      
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(userData))
      setUser(userData)
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Login failed')
    }
  }

  const register = async (name: string, email: string, password: string, company?: string) => {
    try {
      const response = await authAPI.register({ name, email, password, company })
      const { token, user: userData } = response.data
      
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(userData))
      setUser(userData)
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Registration failed')
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    authAPI.logout().catch(console.error)
  }

  const updateProfile = async (data: { name?: string; company?: string }) => {
    try {
      const response = await authAPI.updateProfile(data)
      const updatedUser = response.data.user
      
      localStorage.setItem('user', JSON.stringify(updatedUser))
      setUser(updatedUser)
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Profile update failed')
    }
  }

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      await authAPI.changePassword({ currentPassword, newPassword })
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Password change failed')
    }
  }

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
