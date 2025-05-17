'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '../providers/AuthProvider'
import { doseLogApi } from '../services/api'
import { format } from 'date-fns'
import { Award, AlertTriangle, Calendar, Check, Compass, Plus, Pill, PillIcon, X } from 'lucide-react'
import { Activity, BarChart2, Clock, Pill as PillIcon2 } from 'lucide-react'

type ScheduleItem = {
  medicationId: number
  medication: {
    id: number
    name: string
    dose: string
    category?: {
      id: number
      name: string
    }
  }
  scheduledTime: string
  status: 'pending' | 'taken' | 'missed' | 'skipped'
}

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [schedule, setSchedule] = useState<ScheduleItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  // Format time
  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':')
    return format(new Date().setHours(Number(hours), Number(minutes)), 'h:mm a')
  }

  // Check if medication is due now (within 10 minutes before to 30 minutes after)
  const isDueNow = (timeString: string) => {
    const now = new Date()
    const [hours, minutes] = timeString.split(':').map(Number)
    const scheduledTime = new Date()
    scheduledTime.setHours(hours, minutes, 0, 0)
    
    const diffMinutes = (now.getTime() - scheduledTime.getTime()) / (1000 * 60)
    return diffMinutes >= -10 && diffMinutes <= 30
  }

  // Check if a dose is past the 4-hour window
  const isPastWindow = (timeString: string) => {
    const now = new Date()
    const [hours, minutes] = timeString.split(':').map(Number)
    const scheduledTime = new Date()
    scheduledTime.setHours(hours, minutes, 0, 0)
    
    const diffMinutes = (now.getTime() - scheduledTime.getTime()) / (1000 * 60)
    return diffMinutes > 240 // More than 4 hours
  }

  // Fetch today's schedule
  useEffect(() => {
    // Only fetch when authentication is complete
    if (authLoading) return
    
    // Don't fetch if not authenticated
    if (!isAuthenticated) {
      setError('Authentication required. Please log in.')
      setIsLoading(false)
      return
    }

    const fetchSchedule = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const response = await doseLogApi.getTodaySchedule()
        setSchedule(response.data.schedule)
      } catch (err: any) {
        console.error('Error fetching schedule:', err)
        // Show more detailed error message
        const errorMessage = err.response?.status === 401 
          ? 'Authentication error. Please log in again.'
          : err.response?.data?.message || 'Failed to load today\'s schedule. Please try again.';
        
        setError(errorMessage)
        
        // If there's an auth error, redirect to login
        if (err.response?.status === 401) {
          window.location.href = '/login';
        }
        
        // Auto-retry up to 3 times for non-auth errors
        if (err.response?.status !== 401 && retryCount < 3) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 2000);
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchSchedule()
  }, [authLoading, isAuthenticated, retryCount])

  // Log a dose
  const handleLogDose = async (medicationId: number, scheduledTime: string, status: 'taken' | 'missed' | 'skipped' = 'taken') => {
    try {
      setError(null)
      const response = await doseLogApi.logDose({
        medicationId,
        scheduledTime,
        status
      })
      
      // Get the actual status from the response (might be different than requested)
      const actualStatus = response.data.doseLog.status
      
      // Check if there's a warning message (dose was automatically marked as missed)
      if (status === 'taken' && actualStatus === 'missed') {
        setError(response.data.message || 'Dose automatically marked as missed because it was more than 4 hours late')
      }
      
      // Update local state with the actual status from the server
      setSchedule(prevSchedule => 
        prevSchedule.map(item => 
          item.medicationId === medicationId && item.scheduledTime === scheduledTime
            ? { ...item, status: actualStatus }
            : item
        )
      )
    } catch (err: any) {
      console.error('Error logging dose:', err)
      setError(err.response?.data?.message || 'Failed to log dose. Please try again.')
      
      // If auth error, redirect to login
      if (err.response?.status === 401) {
        window.location.href = '/login';
      }
    }
  }

  // Render authentication loading state
  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl">Checking authentication...</div>
      </div>
    )
  }
  
  // Render not authenticated state
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <div className="text-xl mb-4 text-red-600">You need to log in to view this page</div>
        <Link 
          href="/login" 
          className="bg-primary text-white hover:bg-primary/90 px-4 py-2 rounded"
        >
          Go to Login
        </Link>
      </div>
    )
  }

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="text-xl">Loading your schedule...</div>
      </div>
    )
  }

  // Group medications by time
  const scheduleByTime = schedule.reduce((acc, item) => {
    const time = item.scheduledTime
    if (!acc[time]) {
      acc[time] = []
    }
    acc[time].push(item)
    return acc
  }, {} as Record<string, ScheduleItem[]>)

  // Check if there are any items in the schedule
  const hasScheduleItems = Object.keys(scheduleByTime).length > 0

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Today's Schedule</h1>
          <p className="text-gray-500">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        
        {user?.streak && user.streak > 0 && (
          <div className="hidden md:flex items-center p-3 bg-amber-50 text-amber-800 rounded-lg border border-amber-200">
            <Award className="h-5 w-5 mr-2 text-amber-500" />
            <div>
              <p className="font-medium">{user.streak} Day Streak!</p>
              <p className="text-xs">Keep it up to stay on track</p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-sm">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{error}</p>
              {retryCount > 0 && (
                <p className="text-xs mt-1">
                  Retry attempt {retryCount}/3
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="bg-white rounded-xl shadow-sm p-8 flex justify-center">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-500">Loading your medications...</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-4">
          <div className="md:col-span-3">
            {hasScheduleItems ? (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden divide-y divide-gray-100">
                {Object.entries(scheduleByTime)
                  .sort(([timeA], [timeB]) => timeA.localeCompare(timeB))
                  .map(([time, items]) => {
                    const isDue = isDueNow(time);
                    return (
                      <div 
                        key={time} 
                        className={`
                          p-5 transition-colors
                          ${isDue ? 'bg-blue-50 border-l-4 border-blue-500' : ''}
                        `}
                      >
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="text-lg font-semibold flex items-center">
                            <Clock className="h-5 w-5 mr-2 text-primary" />
                            {formatTime(time)}
                          </h3>
                          {isDue && (
                            <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-1 rounded-full font-medium">
                              Due now
                            </span>
                          )}
                        </div>

                        <div className="space-y-4">
                          {items.map((item) => (
                            <div 
                              key={`${item.medicationId}-${item.scheduledTime}`}
                              className="bg-white rounded-lg border p-4 flex justify-between items-center shadow-sm"
                            >
                              <div className="flex items-center">
                                <PillIcon className="h-5 w-5 text-primary mr-3" />
                                <div>
                                  <h4 className="font-medium">{item.medication.name}</h4>
                                  <p className="text-sm text-gray-500">{item.medication.dose}</p>
                                  {item.medication.category && (
                                    <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-gray-100 text-gray-800 rounded-full">
                                      {item.medication.category.name}
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-center">
                                {item.status === 'pending' ? (
                                  <>
                                    <button
                                      onClick={() => handleLogDose(item.medicationId, item.scheduledTime, 'taken')}
                                      className="bg-green-100 text-green-800 hover:bg-green-200 mr-2 px-3 py-1 rounded-md flex items-center"
                                    >
                                      <Check className="h-4 w-4 mr-1" />
                                      Take
                                    </button>
                                    <button
                                      onClick={() => handleLogDose(item.medicationId, item.scheduledTime, 'skipped')}
                                      className="bg-gray-100 text-gray-800 hover:bg-gray-200 px-3 py-1 rounded-md flex items-center"
                                    >
                                      <X className="h-4 w-4 mr-1" />
                                      Skip
                                    </button>
                                  </>
                                ) : item.status === 'taken' ? (
                                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-md flex items-center">
                                    <Check className="h-4 w-4 mr-1" />
                                    Taken
                                  </span>
                                ) : item.status === 'missed' ? (
                                  <span className="bg-red-100 text-red-800 px-3 py-1 rounded-md flex items-center">
                                    <X className="h-4 w-4 mr-1" />
                                    Missed
                                  </span>
                                ) : (
                                  <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-md flex items-center">
                                    <X className="h-4 w-4 mr-1" />
                                    Skipped
                                  </span>
                                )}
                                
                                {item.status === 'pending' && isPastWindow(item.scheduledTime) && (
                                  <div className="ml-2 text-xs text-red-600 flex items-center">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    Past 4hr window
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <div className="flex flex-col items-center">
                  <Calendar className="h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No medications scheduled for today</h3>
                  <p className="text-gray-500 mb-6">You don't have any medications scheduled for today.</p>
                  <Link 
                    href="/dashboard/medications" 
                    className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md inline-flex items-center transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Medication
                  </Link>
                </div>
              </div>
            )}
          </div>
          
          <div className="md:col-span-1 space-y-6">
            {/* Quick stats card */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="font-medium text-gray-900 mb-4 flex items-center">
                <Activity className="h-5 w-5 mr-2 text-primary" />
                Quick Stats
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Total medications:</span>
                  <span className="font-medium">{schedule.length || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Taken today:</span>
                  <span className="font-medium text-green-600">
                    {schedule.filter(item => item.status === 'taken').length || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Pending:</span>
                  <span className="font-medium text-amber-600">
                    {schedule.filter(item => item.status === 'pending').length || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Missed:</span>
                  <span className="font-medium text-red-600">
                    {schedule.filter(item => item.status === 'missed').length || 0}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Quick navigation links */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="font-medium text-gray-900 mb-4 flex items-center">
                <Compass className="h-5 w-5 mr-2 text-primary" />
                Quick Links
              </h3>
              <div className="space-y-2">
                <Link 
                  href="/dashboard/medications" 
                  className="block p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center">
                    <Pill className="h-4 w-4 text-primary mr-2" />
                    <span className="text-sm">Manage Medications</span>
                  </div>
                </Link>
                <Link 
                  href="/dashboard/schedule" 
                  className="block p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-primary mr-2" />
                    <span className="text-sm">Weekly Schedule</span>
                  </div>
                </Link>
                <Link 
                  href="/dashboard/stats" 
                  className="block p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center">
                    <BarChart2 className="h-4 w-4 text-primary mr-2" />
                    <span className="text-sm">View Statistics</span>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 