'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '../providers/AuthProvider'
import { 
  LogOut, 
  User, 
  Home, 
  Pill, 
  Calendar, 
  BarChart2, 
  FileText, 
  Menu, 
  X,
  Award,
  ChevronRight,
  CheckCircle2
} from 'lucide-react'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, isLoading, isAuthenticated, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Protected layout - redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isLoading, isAuthenticated, router])

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <div className="text-xl font-medium text-gray-700">Loading your dashboard...</div>
        </div>
      </div>
    )
  }

  // Don't render anything if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null
  }

  // Check if a navigation item is active
  const isActive = (path: string) => {
    if (path === '/dashboard' && pathname === '/dashboard') {
      return true
    }
    return pathname?.startsWith(path) && path !== '/dashboard'
  }

  // Navigation items
  const navItems = [
    { 
      path: '/dashboard', 
      label: 'Dashboard', 
      icon: <Home className="h-5 w-5" /> 
    },
    { 
      path: '/dashboard/medications', 
      label: 'Medications', 
      icon: <Pill className="h-5 w-5" /> 
    },
    { 
      path: '/dashboard/schedule', 
      label: 'Schedule', 
      icon: <Calendar className="h-5 w-5" /> 
    },
    { 
      path: '/dashboard/stats', 
      label: 'Adherence Stats', 
      icon: <BarChart2 className="h-5 w-5" /> 
    },
    { 
      path: '/dashboard/reports', 
      label: 'Reports', 
      icon: <FileText className="h-5 w-5" /> 
    }
  ]

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {/* Mobile menu button */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-20 p-4 bg-white shadow-sm flex justify-between items-center">
        <Link href="/dashboard" className="text-xl font-bold text-primary flex items-center">
          <CheckCircle2 className="h-6 w-6 mr-2" /> 
          MedTracker
        </Link>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-md hover:bg-gray-100"
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      
      {/* Mobile navigation overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-10"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <div className={`
        fixed md:static inset-y-0 left-0 z-10 transform
        md:translate-x-0 transition duration-200 ease-in-out
        bg-white text-gray-800 w-64 shadow-lg md:shadow-none
        flex flex-col overflow-y-auto
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-5 border-b">
          <Link href="/dashboard" className="text-xl font-bold text-primary flex items-center">
            <CheckCircle2 className="h-6 w-6 mr-2" /> 
            MedTracker
          </Link>
        </div>

        {/* User info */}
        <div className="p-5 flex items-center border-b">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <User className="h-6 w-6" />
          </div>
          <div className="ml-3">
            <p className="font-medium">{user?.name || user?.email}</p>
            <div className="flex items-center text-sm text-gray-500">
              <Award className="h-4 w-4 mr-1 text-amber-500" />
              <span>{user?.streak || 0} day streak</span>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {navItems.map(item => (
              <li key={item.path}>
                <Link 
                  href={item.path} 
                  className={`
                    flex items-center justify-between p-3 rounded-md
                    transition-colors duration-150
                    ${isActive(item.path) 
                      ? 'bg-primary text-white font-medium shadow-sm' 
                      : 'hover:bg-gray-100'}
                  `}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className="flex items-center">
                    <span className={`${isActive(item.path) ? '' : 'text-primary'}`}>
                      {item.icon}
                    </span>
                    <span className="ml-3">{item.label}</span>
                  </div>
                  {isActive(item.path) && <ChevronRight className="h-4 w-4" />}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t">
          <button
            onClick={logout}
            className="flex items-center gap-2 p-3 w-full text-left rounded-md hover:bg-gray-100 transition-colors duration-150"
          >
            <LogOut className="h-5 w-5 text-red-500" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 pt-16 md:pt-0 md:pb-0 p-4 md:p-0">
        <div className="max-w-6xl mx-auto md:p-6 md:pt-8">
          {children}
        </div>
      </main>
    </div>
  )
} 