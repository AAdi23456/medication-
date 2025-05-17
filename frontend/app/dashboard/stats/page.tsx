'use client'

import { useState, useEffect } from 'react'
import { doseLogApi } from '../../services/api'
import { format, subDays, startOfWeek, addDays, parseISO } from 'date-fns'
import { Loader2, Calendar, AlertTriangle, BarChart2, Download, PieChart, ChevronRight, ChevronLeft } from 'lucide-react'

type AdherenceStats = {
  overall: number
  byMedication: {
    medicationId: number
    medicationName: string
    adherenceRate: number
    missed: number
    taken: number
    total: number
  }[]
  byDay: {
    date: string
    adherenceRate: number
    missed: number
    taken: number
    total: number
  }[]
}

export default function StatsPage() {
  const [stats, setStats] = useState<AdherenceStats | null>(null)
  const [dateRange, setDateRange] = useState({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch adherence stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const response = await doseLogApi.getStats({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate
        })
        
        // Handle backend response format that might be using adherencePercentage as a 0-100 value
        // rather than the 0-1 decimal used elsewhere in our frontend
        const data = response.data;
        if (data && typeof data.overall === 'object' && 'adherencePercentage' in data.overall) {
          // Convert percentage (0-100) to decimal (0-1) if needed
          data.overall = data.overall.adherencePercentage / 100;
          
          // Also convert byMedication array if present
          if (data.byMedication && Array.isArray(data.byMedication)) {
            data.byMedication = data.byMedication.map((med: { adherencePercentage: number, [key: string]: any }) => ({
              ...med,
              adherenceRate: med.adherencePercentage / 100
            }));
          }
          
          // Also convert byDay array if present
          if (data.byDay && Array.isArray(data.byDay)) {
            data.byDay = data.byDay.map((day: { adherencePercentage: number, [key: string]: any }) => ({
              ...day,
              adherenceRate: day.adherencePercentage / 100
            }));
          }
        }
        
        setStats(data)
      } catch (err: any) {
        console.error('Error fetching adherence stats:', err)
        setError(err.response?.data?.message || 'Failed to load adherence statistics. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchStats()
  }, [dateRange])

  // Handle date range change
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setDateRange(prev => ({ ...prev, [name]: value }))
  }

  // Set quick date range 
  const setQuickDateRange = (days: number) => {
    setDateRange({
      startDate: format(subDays(new Date(), days), 'yyyy-MM-dd'),
      endDate: format(new Date(), 'yyyy-MM-dd')
    })
  }

  // Generate the calendar heatmap data
  const generateCalendarData = () => {
    if (!stats?.byDay) return []
    
    const calendarData: { date: Date; adherence: number; total: number }[] = []
    
    // Convert the byDay data to a map for easier lookup
    const dayMap = new Map(
      stats.byDay.map(day => [day.date, { 
        adherenceRate: day.adherenceRate,
        total: day.total 
      }])
    )
    
    // Start from 4 weeks ago
    const startDate = startOfWeek(parseISO(dateRange.startDate))
    const endDate = parseISO(dateRange.endDate)
    
    let currentDate = startDate
    while (currentDate <= endDate) {
      const dateStr = format(currentDate, 'yyyy-MM-dd')
      const dayData = dayMap.get(dateStr)
      
      calendarData.push({
        date: new Date(currentDate),
        adherence: dayData?.adherenceRate || 0,
        total: dayData?.total || 0
      })
      
      currentDate = addDays(currentDate, 1)
    }
    
    return calendarData
  }

  // Get color based on adherence rate
  const getAdherenceColor = (rate: number) => {
    if (rate >= 0.8) return 'bg-green-500'
    if (rate >= 0.5) return 'bg-yellow-500'
    if (rate > 0) return 'bg-red-500'
    return 'bg-gray-200'
  }

  // Get text color based on adherence rate
  const getAdherenceTextColor = (rate: number) => {
    if (rate >= 0.8) return 'text-green-600'
    if (rate >= 0.5) return 'text-yellow-600'
    if (rate > 0) return 'text-red-600'
    return 'text-gray-600'
  }

  // Calculate statistics summary
  const calculateSummary = () => {
    if (!stats || !stats.byMedication) return null
    
    const totalDoses = stats.byMedication.reduce((acc, med) => acc + med.total, 0)
    const takenDoses = stats.byMedication.reduce((acc, med) => acc + med.taken, 0)
    const missedDoses = stats.byMedication.reduce((acc, med) => acc + med.missed, 0)
    
    return {
      totalDoses,
      takenDoses,
      missedDoses
    }
  }

  // Generate PDF report
  const handleGeneratePdf = async () => {
    try {
      setIsLoading(true)
      
      const response = await doseLogApi.generatePdfReport({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      })
      
      // Create a blob and download
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `adherence-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      setIsLoading(false)
    } catch (err) {
      console.error('Error generating PDF:', err)
      setError('Failed to generate PDF report. Please try again.')
      setIsLoading(false)
    }
  }

  // Generate CSV export
  const handleGenerateCsv = async () => {
    try {
      setIsLoading(true)
      
      const response = await doseLogApi.generateCsvExport({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      })
      
      // Create a blob and download
      const blob = new Blob([response.data], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `adherence-data-${format(new Date(), 'yyyy-MM-dd')}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      setIsLoading(false)
    } catch (err) {
      console.error('Error generating CSV:', err)
      setError('Failed to generate CSV export. Please try again.')
      setIsLoading(false)
    }
  }

  const summary = calculateSummary()

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Adherence Statistics</h1>
        <div className="flex space-x-2">
          <button
            onClick={handleGeneratePdf}
            disabled={isLoading || !stats}
            className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 flex items-center transition-colors disabled:bg-gray-400"
          >
            <Download className="w-4 h-4 mr-2" />
            PDF
          </button>
          <button
            onClick={handleGenerateCsv}
            disabled={isLoading || !stats}
            className="bg-gray-100 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-200 flex items-center transition-colors disabled:bg-gray-300"
          >
            <Download className="w-4 h-4 mr-2" />
            CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-sm">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-3 bg-white rounded-xl shadow-sm p-5">
          <h2 className="text-lg font-semibold mb-3 flex items-center text-gray-900">
            <Calendar className="h-5 w-5 mr-2 text-primary" />
            Date Range
          </h2>
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={dateRange.startDate}
                  onChange={handleDateChange}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={dateRange.endDate}
                  onChange={handleDateChange}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                />
              </div>
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={() => setQuickDateRange(7)}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm transition-colors"
              >
                Last 7 days
              </button>
              <button
                onClick={() => setQuickDateRange(30)}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm transition-colors"
              >
                Last 30 days
              </button>
              <button
                onClick={() => setQuickDateRange(90)}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm transition-colors"
              >
                Last 90 days
              </button>
            </div>
          </div>
        </div>

        {summary && (
          <div className="md:col-span-1 bg-white rounded-xl shadow-sm p-5">
            <h2 className="text-lg font-semibold mb-3 flex items-center text-gray-900">
              <PieChart className="h-5 w-5 mr-2 text-primary" />
              Summary
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Total doses:</span>
                <span className="font-medium">{summary.totalDoses}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Taken:</span>
                <span className="font-medium text-green-600">{summary.takenDoses}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Missed:</span>
                <span className="font-medium text-red-600">{summary.missedDoses}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Adherence:</span>
                <span className={`font-medium ${getAdherenceTextColor(stats?.overall || 0)}`}>
                  {stats ? Math.round(stats.overall * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="bg-white rounded-xl shadow-sm p-12 flex justify-center">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-500">Loading your statistics...</p>
          </div>
        </div>
      ) : !stats ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="flex flex-col items-center">
            <BarChart2 className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No statistics available</h3>
            <p className="text-gray-500 mb-6">No medication data available for the selected period.</p>
          </div>
        </div>
      ) : (
        <>
          {/* Overall Adherence */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h2 className="text-lg font-semibold mb-4 flex items-center text-gray-900">
                <BarChart2 className="w-5 h-5 mr-2 text-primary" />
                Overall Adherence
              </h2>
              <div className="text-center my-6">
                <div className="inline-flex items-center justify-center h-32 w-32 rounded-full border-8 border-gray-100 relative">
                  <div className="text-3xl font-bold">
                    {stats && typeof stats.overall === 'number' 
                      ? `${Math.round(stats.overall * 100)}%` 
                      : '0%'}
                  </div>
                  <svg className="absolute inset-0" width="128" height="128" viewBox="0 0 128 128">
                    <circle 
                      cx="64" 
                      cy="64" 
                      r="60" 
                      fill="none" 
                      stroke="#E5E7EB" 
                      strokeWidth="8" 
                    />
                    <circle 
                      cx="64" 
                      cy="64" 
                      r="60" 
                      fill="none" 
                      stroke={stats && typeof stats.overall === 'number' 
                        ? (stats.overall >= 0.8 ? '#10B981' : stats.overall >= 0.5 ? '#F59E0B' : '#EF4444') 
                        : '#E5E7EB'} 
                      strokeWidth="8" 
                      strokeDasharray={`${stats && typeof stats.overall === 'number' 
                        ? stats.overall * 376.8 
                        : 0} 376.8`}
                      transform="rotate(-90 64 64)"
                    />
                  </svg>
                </div>
              </div>
              <div className="text-center text-sm text-gray-600">
                Based on {summary?.totalDoses || 0} scheduled doses
              </div>
            </div>

            {/* Daily Adherence Chart */}
            <div className="bg-white rounded-xl shadow-sm p-5 col-span-2">
              <h2 className="text-lg font-semibold mb-4 flex items-center text-gray-900">
                <Calendar className="w-5 h-5 mr-2 text-primary" />
                Daily Adherence
              </h2>
              {stats.byDay && stats.byDay.length > 0 ? (
                <div className="space-y-3 h-64 overflow-y-auto pr-2 pt-2">
                  {stats.byDay
                    .slice(-7)
                    .reverse()
                    .map(day => (
                      <div key={day.date} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <div className="font-medium">{format(parseISO(day.date), 'EEE, MMM d')}</div>
                          <div className={`text-sm font-medium ${getAdherenceTextColor(day.adherenceRate)}`}>
                            {Math.round(day.adherenceRate * 100)}%
                          </div>
                        </div>
                        <div className="relative h-6 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`absolute top-0 left-0 h-full ${getAdherenceColor(day.adherenceRate)}`}
                            style={{ width: `${day.adherenceRate * 100}%` }}
                          ></div>
                          <div className="absolute inset-0 flex items-center px-2 text-xs font-medium text-white">
                            Taken: {day.taken} / {day.total}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center">
                  <p className="text-gray-500">No daily adherence data available for the selected period.</p>
                </div>
              )}
            </div>
          </div>

          {/* Calendar Heatmap */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h2 className="text-lg font-semibold mb-4 flex items-center text-gray-900">
              <Calendar className="w-5 h-5 mr-2 text-primary" />
              Adherence Calendar
            </h2>
            <div className="grid grid-cols-7 gap-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                  {day}
                </div>
              ))}
              
              {generateCalendarData().map((day, i) => (
                <div 
                  key={i} 
                  className={`aspect-square rounded-md flex items-center justify-center ${
                    day.total > 0 
                      ? getAdherenceColor(day.adherence) 
                      : 'bg-gray-100'
                  }`}
                  title={`${format(day.date, 'MMMM d, yyyy')}: ${
                    day.total > 0 
                      ? `${Math.round(day.adherence * 100)}% (${Math.round(day.adherence * day.total)}/${day.total})` 
                      : 'No doses scheduled'
                  }`}
                >
                  <div className="w-full h-full flex flex-col items-center justify-center text-white">
                    <span className="text-xs font-medium">{format(day.date, 'd')}</span>
                    {day.total > 0 && day.adherence > 0 && (
                      <span className="text-[8px]">{Math.round(day.adherence * 100)}%</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* By Medication */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h2 className="text-lg font-semibold mb-4 flex items-center text-gray-900">
              <PieChart className="w-5 h-5 mr-2 text-primary" />
              Adherence by Medication
            </h2>
            {!stats || !stats.byMedication ? (
              <div className="py-8 text-center text-gray-500">
                No medication data available for the selected period.
              </div>
            ) : stats.byMedication.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                No medication data available for the selected period.
              </div>
            ) : (
              <div className="space-y-5">
                {stats.byMedication
                  .sort((a, b) => a.adherenceRate - b.adherenceRate)
                  .map(med => (
                    <div key={med.medicationId} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between mb-1">
                        <div className="font-medium text-gray-900">{med.medicationName}</div>
                        <div className={`font-medium ${getAdherenceTextColor(med.adherenceRate)}`}>
                          {Math.round(med.adherenceRate * 100)}%
                          {med.adherenceRate < 0.5 && (
                            <AlertTriangle className="inline-block w-4 h-4 ml-1 text-red-500" />
                          )}
                        </div>
                      </div>
                      <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden mb-2">
                        <div 
                          className={`absolute top-0 left-0 h-full ${getAdherenceColor(med.adherenceRate)}`}
                          style={{ width: `${med.adherenceRate * 100}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Taken: {med.taken}/{med.total} doses</span>
                        <span>Missed: {med.missed} doses</span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
} 