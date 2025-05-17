'use client'

import { useState } from 'react'
import { doseLogApi } from '../../services/api'
import { format, subDays, subMonths } from 'date-fns'
import { Loader2, FileText, FileDown, Calendar } from 'lucide-react'

export default function ReportsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // State for date ranges
  const [dateRange, setDateRange] = useState({
    startDate: format(subMonths(new Date(), 1), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  })

  // Handle date range change
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setDateRange(prev => ({ ...prev, [name]: value }))
  }

  // Quick date presets
  const setQuickDateRange = (days: number) => {
    setDateRange({
      startDate: format(subDays(new Date(), days), 'yyyy-MM-dd'),
      endDate: format(new Date(), 'yyyy-MM-dd')
    })
  }

  // Generate PDF report
  const handleGeneratePdf = async () => {
    try {
      setIsLoading(true)
      setError(null)
      setSuccess(null)
      
      const response = await doseLogApi.generatePdfReport({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      })
      
      // Create a blob and download
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `medication-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      setSuccess('PDF report generated successfully!')
      setIsLoading(false)
    } catch (err: any) {
      console.error('Error generating PDF:', err)
      setError(err.response?.data?.message || 'Failed to generate PDF report. Please try again.')
      setIsLoading(false)
    }
  }

  // Generate CSV export
  const handleGenerateCsv = async () => {
    try {
      setIsLoading(true)
      setError(null)
      setSuccess(null)
      
      const response = await doseLogApi.generateCsvExport({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      })
      
      // Create a blob and download
      const blob = new Blob([response.data], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `medication-data-${format(new Date(), 'yyyy-MM-dd')}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      setSuccess('CSV data exported successfully!')
      setIsLoading(false)
    } catch (err: any) {
      console.error('Error generating CSV:', err)
      setError(err.response?.data?.message || 'Failed to generate CSV export. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Reports & Exports</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Date Range Selection */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Select Date Range
          </h2>
          
          <div className="space-y-4">
            <div className="flex flex-col space-y-2">
              <label htmlFor="startDate" className="text-sm font-medium text-gray-700">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={dateRange.startDate}
                onChange={handleDateChange}
                className="px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div className="flex flex-col space-y-2">
              <label htmlFor="endDate" className="text-sm font-medium text-gray-700">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={dateRange.endDate}
                onChange={handleDateChange}
                className="px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Quick Select:</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setQuickDateRange(7)}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm"
              >
                Last 7 days
              </button>
              <button
                onClick={() => setQuickDateRange(30)}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm"
              >
                Last 30 days
              </button>
              <button
                onClick={() => setQuickDateRange(90)}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm"
              >
                Last 90 days
              </button>
            </div>
          </div>
        </div>

        {/* Export Options */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <h2 className="text-lg font-semibold mb-4">Export Options</h2>
          
          <div className="space-y-4">
            <div className="p-4 border rounded-md hover:border-primary">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-primary" />
                    PDF Report
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Generate a detailed PDF report with adherence data and visualizations
                  </p>
                </div>
                <button
                  onClick={handleGeneratePdf}
                  disabled={isLoading}
                  className="bg-primary text-white px-4 py-2 rounded-md disabled:bg-gray-400"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Generate'
                  )}
                </button>
              </div>
            </div>
            
            <div className="p-4 border rounded-md hover:border-primary">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium flex items-center">
                    <FileDown className="w-5 h-5 mr-2 text-primary" />
                    CSV Export
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Export raw dose log data in CSV format for further analysis
                  </p>
                </div>
                <button
                  onClick={handleGenerateCsv}
                  disabled={isLoading}
                  className="bg-primary text-white px-4 py-2 rounded-md disabled:bg-gray-400"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Export'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white rounded-lg shadow-md p-4">
        <h2 className="text-lg font-semibold mb-2">About Reports</h2>
        <p className="text-gray-600">
          Reports provide a comprehensive overview of your medication adherence. They include:
        </p>
        <ul className="list-disc pl-5 mt-2 text-gray-600 space-y-1">
          <li>Overall adherence statistics for the selected period</li>
          <li>Adherence rates broken down by medication</li>
          <li>Daily tracking of taken vs. missed doses</li>
          <li>Visual calendar to identify patterns in missed doses</li>
        </ul>
        
        <div className="mt-4 p-3 bg-blue-50 text-blue-800 rounded-md text-sm">
          <p>
            <strong>Tip:</strong> Share these reports with your healthcare provider to help them 
            understand your medication adherence patterns.
          </p>
        </div>
      </div>
    </div>
  )
} 