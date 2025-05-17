'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Edit, Trash2, Loader2, X, Check, AlertTriangle, FileText, Pill, PillIcon } from 'lucide-react'
import { medicationApi, categoryApi } from '../../services/api'
import { format } from 'date-fns'

// Types for our components
type Medication = {
  id: number
  name: string
  dose: string
  frequency: number
  times: string[]
  startDate: string
  endDate?: string
  categoryId?: number
  category?: {
    id: number
    name: string
  }
}

type Category = {
  id: number
  name: string
}

export default function MedicationsPage() {
  // State
  const [medications, setMedications] = useState<Medication[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null)
  const [newMedication, setNewMedication] = useState<{
    name: string
    dose: string
    frequency: number
    times: string[]
    startDate: string
    endDate?: string
    categoryId?: number
  }>({
    name: '',
    dose: '',
    frequency: 1,
    times: ['08:00'],
    startDate: format(new Date(), 'yyyy-MM-dd')
  })

  // Fetch medications and categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Fetch medications and categories
        const [medicationsRes, categoriesRes] = await Promise.all([
          medicationApi.getAll(),
          categoryApi.getAll()
        ])

        setMedications(medicationsRes.data.medications || [])
        setCategories(categoriesRes.data.categories || [])
      } catch (err: any) {
        console.error('Error fetching data:', err)
        setError(err.response?.data?.message || 'Failed to load data. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setNewMedication(prev => ({ ...prev, [name]: value }))
  }

  // Handle frequency change - update times array
  const handleFrequencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const frequency = parseInt(e.target.value)
    let times: string[] = []

    // Generate default times based on frequency
    if (frequency === 1) {
      times = ['08:00']
    } else if (frequency === 2) {
      times = ['08:00', '20:00']
    } else if (frequency === 3) {
      times = ['08:00', '14:00', '20:00']
    } else if (frequency === 4) {
      times = ['08:00', '12:00', '16:00', '20:00']
    } else {
      // For other frequencies, create empty slots
      times = Array(frequency).fill('08:00')
    }

    setNewMedication(prev => ({ ...prev, frequency, times }))
  }

  // Handle time change at specific index
  const handleTimeChange = (index: number, time: string) => {
    const updatedTimes = [...newMedication.times]
    updatedTimes[index] = time
    setNewMedication(prev => ({ ...prev, times: updatedTimes }))
  }

  // Handle medication edit
  const handleEdit = (medication: Medication) => {
    setEditingMedication(medication)
    setNewMedication({
      name: medication.name,
      dose: medication.dose,
      frequency: medication.frequency,
      times: medication.times,
      startDate: medication.startDate,
      endDate: medication.endDate,
      categoryId: medication.categoryId
    })
    setShowNewForm(true)
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsLoading(true)
      setError(null)

      if (editingMedication) {
        // Update existing medication
        await medicationApi.update(editingMedication.id, {
          ...newMedication,
          frequency: Number(newMedication.frequency),
          categoryId: newMedication.categoryId ? Number(newMedication.categoryId) : undefined
        })
      } else {
        // Create new medication
        await medicationApi.create({
          ...newMedication,
          frequency: Number(newMedication.frequency),
          categoryId: newMedication.categoryId ? Number(newMedication.categoryId) : undefined
        })
      }

      // Refresh medications
      const response = await medicationApi.getAll()
      setMedications(response.data.medications || [])

      // Reset form
      setNewMedication({
        name: '',
        dose: '',
        frequency: 1,
        times: ['08:00'],
        startDate: format(new Date(), 'yyyy-MM-dd')
      })
      setEditingMedication(null)
      setShowNewForm(false)
    } catch (err: any) {
      console.error('Error saving medication:', err)
      setError(err.response?.data?.message || 'Failed to save medication. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle medication deletion
  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this medication?')) return

    try {
      setIsLoading(true)
      setError(null)

      // Delete medication
      await medicationApi.delete(id)

      // Refresh medications
      const response = await medicationApi.getAll()
      setMedications(response.data.medications || [])
    } catch (err: any) {
      console.error('Error deleting medication:', err)
      setError(err.response?.data?.message || 'Failed to delete medication. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">My Medications</h1>
        <button
          onClick={() => setShowNewForm(!showNewForm)}
          className={`
            px-4 py-2 rounded-md flex items-center shadow-sm transition-colors
            ${showNewForm 
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
              : 'bg-primary text-white hover:bg-primary/90'}
          `}
        >
          {showNewForm ? (
            <>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Add Medication
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-sm">
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

      {showNewForm && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold mb-4 flex items-center text-gray-900">
            <FileText className="w-5 h-5 mr-2 text-primary" />
            {editingMedication ? 'Edit Medication' : 'Add New Medication'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Medication Name*
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={newMedication.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  placeholder="e.g., Aspirin, Lisinopril"
                />
              </div>

              <div>
                <label htmlFor="dose" className="block text-sm font-medium text-gray-700 mb-1">
                  Dose*
                </label>
                <input
                  type="text"
                  id="dose"
                  name="dose"
                  value={newMedication.dose}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., 10mg, 1 tablet"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                />
              </div>

              <div>
                <label htmlFor="frequency" className="block text-sm font-medium text-gray-700 mb-1">
                  Frequency (times per day)*
                </label>
                <select
                  id="frequency"
                  name="frequency"
                  value={newMedication.frequency}
                  onChange={handleFrequencyChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                >
                  {[1, 2, 3, 4].map(num => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? 'time' : 'times'} per day
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  Category (Optional)
                </label>
                <select
                  id="categoryId"
                  name="categoryId"
                  value={newMedication.categoryId || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                >
                  <option value="">-- No Category --</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date*
                </label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={newMedication.startDate}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                />
              </div>

              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                  End Date (Optional)
                </label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={newMedication.endDate || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                />
              </div>
            </div>

            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Scheduled Times*</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {newMedication.times.map((time, index) => (
                  <div key={index}>
                    <label htmlFor={`time-${index}`} className="sr-only">
                      Time {index + 1}
                    </label>
                    <input
                      type="time"
                      id={`time-${index}`}
                      value={time}
                      onChange={(e) => handleTimeChange(index, e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button
                type="submit"
                disabled={isLoading}
                className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 flex items-center disabled:bg-gray-400"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Save Medication
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading && !showNewForm ? (
        <div className="bg-white rounded-xl shadow-sm p-12 flex justify-center">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-500">Loading your medications...</p>
          </div>
        </div>
      ) : medications.length === 0 && !showNewForm ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="flex flex-col items-center">
            <Pill className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No medications added yet</h3>
            <p className="text-gray-500 mb-6">Add medications to start tracking your regimen</p>
            <button
              onClick={() => setShowNewForm(true)}
              className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md inline-flex items-center transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add First Medication
            </button>
          </div>
        </div>
      ) : !showNewForm && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {medications.map(medication => (
            <div key={medication.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-5">
                <div className="flex justify-between">
                  <h3 className="font-medium text-lg text-gray-900">{medication.name}</h3>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleEdit(medication)}
                      className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(medication.id)}
                      className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="mt-2 flex items-center">
                  <PillIcon className="h-4 w-4 text-primary mr-1.5" />
                  <span className="text-gray-600">{medication.dose}</span>
                  {medication.category && (
                    <span className="ml-2 text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                      {medication.category.name}
                    </span>
                  )}
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Frequency:</span>
                    <span className="font-medium text-gray-900">
                      {medication.frequency}× daily
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm text-gray-500 mt-1">
                    <span>Times:</span>
                    <span className="font-medium text-gray-900 text-right">
                      {medication.times.map(time => {
                        const [hours, minutes] = time.split(':')
                        return format(new Date().setHours(Number(hours), Number(minutes)), 'h:mm a')
                      }).join(', ')}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-sm text-gray-500 mt-1">
                    <span>Start Date:</span>
                    <span className="font-medium text-gray-900">
                      {format(new Date(medication.startDate), 'MMM d, yyyy')}
                    </span>
                  </div>
                  
                  {medication.endDate && (
                    <div className="flex justify-between text-sm text-gray-500 mt-1">
                      <span>End Date:</span>
                      <span className="font-medium text-gray-900">
                        {format(new Date(medication.endDate), 'MMM d, yyyy')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 