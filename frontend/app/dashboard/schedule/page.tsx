'use client'

import { useState, useEffect } from 'react'
import { doseLogApi } from '../../services/api'
import { format, addDays, isSameDay, startOfWeek, parseISO } from 'date-fns'
import { Loader2, ArrowLeft, ArrowRight, Check, X } from 'lucide-react'

type ScheduleItem = {
  id?: number
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
  date: string
}

export default function SchedulePage() {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([])
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 0 }))
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Format time
  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':')
    return format(new Date().setHours(Number(hours), Number(minutes)), 'h:mm a')
  }

  // Fetch schedule data
  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Format date strings for API request
        const startDate = format(currentWeekStart, 'yyyy-MM-dd')
        const endDate = format(addDays(currentWeekStart, 6), 'yyyy-MM-dd')
        
        // Get all dose logs for the week
        const logsResponse = await doseLogApi.getAll({ startDate, endDate })
        const doseLogs = logsResponse.data.doseLogs || []
        
        // Get medication schedule for the week
        const scheduleResponse = await doseLogApi.getWeeklySchedule({ startDate, endDate })
        const scheduledDoses = scheduleResponse.data.schedule || []
        
        // Merge the logs and scheduled doses, prioritizing logged doses
        const merged = [...scheduledDoses]
        
        // Create a unique identifier for each dose
        const loggedDoseKeys = new Set(
          doseLogs.map(log => `${log.medicationId}-${log.scheduledTime}-${format(new Date(log.createdAt), 'yyyy-MM-dd')}`)
        )
        
        // Filter out any scheduled doses that have already been logged
        const mergedSchedule = merged.filter(item => {
          const key = `${item.medicationId}-${item.scheduledTime}-${item.date}`
          return !loggedDoseKeys.has(key)
        })
        
        // Add all logged doses
        doseLogs.forEach(log => {
          const logDate = format(new Date(log.createdAt), 'yyyy-MM-dd')
          mergedSchedule.push({
            id: log.id,
            medicationId: log.medicationId,
            medication: log.medication,
            scheduledTime: log.scheduledTime,
            status: log.status,
            date: logDate
          })
        })
        
        setSchedule(mergedSchedule)
      } catch (err: any) {
        console.error('Error fetching schedule:', err)
        setError(err.response?.data?.message || 'Failed to load schedule. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchSchedule()
  }, [currentWeekStart])

  // Navigate to previous week
  const goToPreviousWeek = () => {
    setCurrentWeekStart(prevDate => addDays(prevDate, -7))
  }

  // Navigate to next week
  const goToNextWeek = () => {
    setCurrentWeekStart(prevDate => addDays(prevDate, 7))
  }

  // Handle logging a dose
  const handleLogDose = async (medicationId: number, scheduledTime: string, date: string, status: 'taken' | 'missed' | 'skipped') => {
    try {
      setError(null)
      
      // Only make API call if it's a pending dose
      const existingDose = schedule.find(
        item => item.medicationId === medicationId && 
               item.scheduledTime === scheduledTime && 
               item.date === date
      )

      if (existingDose && existingDose.status === 'pending') {
        await doseLogApi.logDose({
          medicationId,
          scheduledTime,
          status
        })
      }
      
      // Update local state
      setSchedule(prevSchedule => 
        prevSchedule.map(item => 
          item.medicationId === medicationId && 
          item.scheduledTime === scheduledTime &&
          item.date === date
            ? { ...item, status }
            : item
        )
      )
    } catch (err: any) {
      console.error('Error logging dose:', err)
      setError(err.response?.data?.message || 'Failed to log dose. Please try again.')
    }
  }

  // Group schedule by date
  const scheduleByDate = schedule.reduce((acc, item) => {
    const date = item.date
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(item)
    return acc
  }, {} as Record<string, ScheduleItem[]>)

  // Generate week days
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(currentWeekStart, i)
    return {
      date,
      dateString: format(date, 'yyyy-MM-dd'),
      dayName: format(date, 'EEE'),
      dayNumber: format(date, 'd'),
      isToday: isSameDay(date, new Date())
    }
  })

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Weekly Schedule</h1>
        <div className="flex space-x-2">
          <button
            onClick={goToPreviousWeek}
            className="bg-gray-200 text-gray-800 p-2 rounded-md hover:bg-gray-300"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="bg-white px-4 py-2 rounded-md text-center">
            <div className="font-medium">
              {format(currentWeekStart, 'MMM d')} - {format(addDays(currentWeekStart, 6), 'MMM d, yyyy')}
            </div>
          </div>
          <button
            onClick={goToNextWeek}
            className="bg-gray-200 text-gray-800 p-2 rounded-md hover:bg-gray-300"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-4">
          {/* Day headers */}
          {weekDays.map(day => (
            <div 
              key={day.dateString} 
              className={`text-center p-2 rounded-t-md font-medium 
                ${day.isToday ? 'bg-primary text-white' : 'bg-gray-100'}`}
            >
              <div>{day.dayName}</div>
              <div className="text-lg">{day.dayNumber}</div>
            </div>
          ))}

          {/* Schedule cells */}
          {weekDays.map(day => (
            <div key={day.dateString} className="bg-white rounded-b-md shadow-md overflow-hidden">
              {!scheduleByDate[day.dateString] || scheduleByDate[day.dateString].length === 0 ? (
                <div className="p-4 text-center text-gray-500 h-full flex items-center justify-center">
                  <div>No medications scheduled</div>
                </div>
              ) : (
                <div className="divide-y">
                  {scheduleByDate[day.dateString]
                    .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime))
                    .map((item, index) => (
                      <div key={`${item.medicationId}-${item.scheduledTime}-${index}`} className="p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">{item.medication.name}</div>
                            <div className="text-sm text-gray-500">
                              {item.medication.dose} • {formatTime(item.scheduledTime)}
                            </div>
                            {item.medication.category && (
                              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                                {item.medication.category.name}
                              </span>
                            )}
                          </div>
                          <div>
                            {item.status === 'pending' ? (
                              <div className="flex space-x-1">
                                <button
                                  onClick={() => handleLogDose(item.medicationId, item.scheduledTime, item.date, 'taken')}
                                  className="bg-green-100 hover:bg-green-200 text-green-800 p-1 rounded"
                                  title="Mark as Taken"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleLogDose(item.medicationId, item.scheduledTime, item.date, 'skipped')}
                                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 p-1 rounded"
                                  title="Mark as Skipped"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <span 
                                className={`inline-block px-2 py-1 rounded text-xs font-medium
                                  ${item.status === 'taken' ? 'bg-green-100 text-green-800' : 
                                  item.status === 'skipped' ? 'bg-gray-100 text-gray-800' : 
                                  'bg-red-100 text-red-800'}`}
                              >
                                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 