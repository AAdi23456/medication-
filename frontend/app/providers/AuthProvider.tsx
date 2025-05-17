'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import axios from 'axios'
import Cookies from 'js-cookie'
import { useRouter } from 'next/navigation'

// API base URL from environment
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

// Types
interface User {
  id: number
  email: string
  name?: string
  streak: number
  lastStreakUpdate?: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name?: string) => Promise<void>
  logout: () => void
  updateUser: (userData: Partial<User>) => void
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Initialize auth state from cookies
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = Cookies.get('token')
        if (storedToken) {
          setToken(storedToken)
          await fetchUser(storedToken)
        } else {
          setIsLoading(false)
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        logout()
      }
    }
    
    initAuth()
  }, [])

  // Set up axios with token
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } else {
      delete axios.defaults.headers.common['Authorization']
    }
  }, [token])

  // Fetch current user
  const fetchUser = async (authToken: string) => {
    try {
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      })
      setUser(response.data.user)
      setIsLoading(false)
      return response.data.user
    } catch (error: any) {
      console.error('Error fetching user:', error)
      // If token is invalid, clear it
      if (error.response?.status === 401) {
        logout()
      }
      setIsLoading(false)
      throw error
    }
  }

  // Login
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      })
      
      const { token: authToken, user: userData } = response.data
      
      // Save token to cookie with secure settings
      Cookies.set('token', authToken, { 
        expires: 7, // 7 days
        secure: window.location.protocol === 'https:',
        sameSite: 'strict',
        path: '/'
      })
      
      // Set token in state and axios defaults
      setToken(authToken)
      axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`
      
      // Update user state
      setUser(userData)
      setIsLoading(false)
      
      // Redirect to dashboard
      router.push('/dashboard')
    } catch (error) {
      setIsLoading(false)
      console.error('Login error:', error)
      throw error
    }
  }

  // Register
  const register = async (email: string, password: string, name?: string) => {
    try {
      setIsLoading(true)
      const response = await axios.post(`${API_URL}/auth/register`, {
        email,
        password,
        name
      })
      
      const { token: authToken, user: userData } = response.data
      
      // Save token to cookie with secure settings
      Cookies.set('token', authToken, { 
        expires: 7, // 7 days
        secure: window.location.protocol === 'https:',
        sameSite: 'strict',
        path: '/'
      })
      
      // Set token in state and axios defaults
      setToken(authToken)
      axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`
      
      // Update user state
      setUser(userData)
      setIsLoading(false)
      
      // Redirect to dashboard
      router.push('/dashboard')
    } catch (error) {
      setIsLoading(false)
      console.error('Registration error:', error)
      throw error
    }
  }

  // Logout
  const logout = () => {
    // Remove token from cookie
    Cookies.remove('token', { path: '/' })
    
    // Remove token from axios defaults
    delete axios.defaults.headers.common['Authorization']
    
    // Reset state
    setToken(null)
    setUser(null)
    
    // Redirect to login
    router.push('/login')
  }

  // Update user data
  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData })
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// Hook for using auth context
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 