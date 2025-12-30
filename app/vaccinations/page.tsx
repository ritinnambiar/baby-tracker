'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { useActiveBaby } from '@/lib/hooks/useActiveBaby'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PageTransition } from '@/components/ui/PageTransition'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { VACCINE_SCHEDULE, getAgeLabel } from '@/lib/constants/vaccines'
import { differenceInMonths, format, parseISO } from 'date-fns'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Vaccination {
  id: string
  baby_id: string
  vaccine_name: string
  age_months: number
  administered_date: string | null
  notes: string | null
  batch_number: string | null
  administered_by: string | null
  is_completed: boolean
}

export default function VaccinationsPage() {
  const { user, loading: authLoading } = useAuth()
  const { activeBaby, loading: babiesLoading } = useActiveBaby()
  const router = useRouter()
  const supabase = createClient()
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVaccine, setSelectedVaccine] = useState<Vaccination | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    administered_date: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
    batch_number: '',
    administered_by: '',
  })

  const babyAgeMonths = activeBaby ? differenceInMonths(new Date(), parseISO(activeBaby.date_of_birth)) : 0

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
  }, [user, router])

  useEffect(() => {
    const fetchVaccinations = async () => {
      if (!activeBaby) {
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('vaccinations')
          .select('*')
          .eq('baby_id', activeBaby.id)
          .order('age_months', { ascending: true })

        if (error) throw error

        setVaccinations(data || [])
      } catch (error) {
        console.error('Error fetching vaccinations:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchVaccinations()
  }, [activeBaby, supabase])

  const initializeSchedule = async () => {
    if (!activeBaby) return

    setLoading(true)
    try {
      const vaccinesData = VACCINE_SCHEDULE.map(vaccine => ({
        baby_id: activeBaby.id,
        vaccine_name: `${vaccine.name}${vaccine.doses ? ` (Dose ${vaccine.doses})` : ''}`,
        age_months: vaccine.ageMonths,
        is_completed: false,
      }))

      const { error } = await supabase
        .from('vaccinations')
        .insert(vaccinesData)

      if (error) throw error

      toast.success('Vaccination schedule initialized!')

      // Refresh data
      const { data } = await supabase
        .from('vaccinations')
        .select('*')
        .eq('baby_id', activeBaby.id)
        .order('age_months', { ascending: true })

      setVaccinations(data || [])
    } catch (error) {
      console.error('Error initializing schedule:', error)
      toast.error('Failed to initialize schedule')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkComplete = async (vaccination: Vaccination) => {
    setSelectedVaccine(vaccination)
    setShowModal(true)
  }

  const handleSaveCompletion = async () => {
    if (!selectedVaccine) return

    try {
      const { error } = await supabase
        .from('vaccinations')
        .update({
          is_completed: true,
          administered_date: formData.administered_date,
          notes: formData.notes || null,
          batch_number: formData.batch_number || null,
          administered_by: formData.administered_by || null,
        })
        .eq('id', selectedVaccine.id)

      if (error) throw error

      toast.success('Vaccination marked as completed!')
      setShowModal(false)
      setSelectedVaccine(null)
      setFormData({
        administered_date: format(new Date(), 'yyyy-MM-dd'),
        notes: '',
        batch_number: '',
        administered_by: '',
      })

      // Refresh data
      const { data } = await supabase
        .from('vaccinations')
        .select('*')
        .eq('baby_id', activeBaby.id)
        .order('age_months', { ascending: true })

      setVaccinations(data || [])
    } catch (error) {
      console.error('Error marking vaccination complete:', error)
      toast.error('Failed to update vaccination')
    }
  }

  const handleUndoCompletion = async (id: string) => {
    try {
      const { error } = await supabase
        .from('vaccinations')
        .update({
          is_completed: false,
          administered_date: null,
          notes: null,
          batch_number: null,
          administered_by: null,
        })
        .eq('id', id)

      if (error) throw error

      toast.success('Vaccination unmarked')

      // Refresh data
      const { data } = await supabase
        .from('vaccinations')
        .select('*')
        .eq('baby_id', activeBaby.id)
        .order('age_months', { ascending: true })

      setVaccinations(data || [])
    } catch (error) {
      console.error('Error undoing vaccination:', error)
      toast.error('Failed to undo')
    }
  }

  const groupByAge = () => {
    const grouped: { [key: number]: Vaccination[] } = {}
    vaccinations.forEach(v => {
      if (!grouped[v.age_months]) {
        grouped[v.age_months] = []
      }
      grouped[v.age_months].push(v)
    })
    return grouped
  }

  if (authLoading || babiesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-baby-pink via-baby-blue to-baby-yellow">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    )
  }

  if (!user) {
    return null
  }

  const groupedVaccines = groupByAge()
  const completedCount = vaccinations.filter(v => v.is_completed).length
  const totalCount = vaccinations.length
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-baby-pink via-baby-blue to-baby-yellow p-4 md:p-8 page-content-mobile">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link href="/dashboard" className="text-primary-600 dark:text-primary-400 hover:underline text-sm mb-2 inline-block">
              ← Back to Dashboard
            </Link>
            <h1 className="text-4xl font-bold text-primary-500 mb-2">💉 Vaccination Schedule</h1>
            {activeBaby && (
              <p className="text-gray-600 dark:text-gray-400">
                {activeBaby.name} • {babyAgeMonths} months old
              </p>
            )}
          </div>

          {!activeBaby ? (
            <Card>
              <div className="text-center py-12">
                <div className="text-6xl mb-4">👶</div>
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                  Please add a baby profile to track vaccinations
                </p>
                <Link href="/settings">
                  <Button>Add Baby</Button>
                </Link>
              </div>
            </Card>
          ) : vaccinations.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <div className="text-6xl mb-4">💉</div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">
                  Set Up Vaccination Schedule
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                  Initialize the standard CDC/WHO vaccination schedule for {activeBaby.name}
                </p>
                <Button size="lg" onClick={initializeSchedule} disabled={loading}>
                  {loading ? 'Setting up...' : 'Initialize Schedule'}
                </Button>
              </div>
            </Card>
          ) : (
            <>
              {/* Progress Card */}
              <Card className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">Progress</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {completedCount} of {totalCount} vaccines completed
                    </p>
                  </div>
                  <div className="text-4xl font-bold text-primary-500">{progressPercent}%</div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                  <div
                    className="bg-primary-500 h-4 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </Card>

              {/* Vaccinations by Age */}
              <div className="space-y-6">
                {Object.entries(groupedVaccines)
                  .sort(([a], [b]) => parseInt(a) - parseInt(b))
                  .map(([ageMonths, vaccines]) => {
                    const age = parseInt(ageMonths)
                    const isPast = age <= babyAgeMonths
                    const isUpcoming = age > babyAgeMonths && age <= babyAgeMonths + 3

                    return (
                      <Card key={ageMonths} className={isUpcoming ? 'border-2 border-yellow-400 dark:border-yellow-600' : ''}>
                        <div className="mb-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                              {getAgeLabel(age)}
                            </h3>
                            {isUpcoming && (
                              <span className="text-xs px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 rounded-full font-medium">
                                Coming Soon
                              </span>
                            )}
                            {age < babyAgeMonths && (
                              <span className="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                                {vaccines.filter(v => v.is_completed).length}/{vaccines.length} completed
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="space-y-3">
                          {vaccines.map((vaccine) => (
                            <div
                              key={vaccine.id}
                              className={`p-4 rounded-xl border-2 transition-all ${
                                vaccine.is_completed
                                  ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    {vaccine.is_completed && <span className="text-green-600 dark:text-green-400">✓</span>}
                                    <h4 className="font-semibold text-gray-800 dark:text-gray-200">
                                      {vaccine.vaccine_name}
                                    </h4>
                                  </div>
                                  {vaccine.is_completed && vaccine.administered_date && (
                                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                                      <div>Administered: {format(parseISO(vaccine.administered_date), 'MMM d, yyyy')}</div>
                                      {vaccine.administered_by && <div>By: {vaccine.administered_by}</div>}
                                      {vaccine.batch_number && <div>Batch: {vaccine.batch_number}</div>}
                                      {vaccine.notes && <div className="mt-1 italic">Note: {vaccine.notes}</div>}
                                    </div>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  {!vaccine.is_completed ? (
                                    <Button
                                      size="sm"
                                      onClick={() => handleMarkComplete(vaccine)}
                                      disabled={!isPast}
                                    >
                                      Mark Complete
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleUndoCompletion(vaccine.id)}
                                    >
                                      Undo
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>
                    )
                  })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Completion Modal */}
      {showModal && selectedVaccine && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowModal(false)} />
          <div className="relative min-h-screen flex items-center justify-center p-4">
            <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">
                Mark Vaccination Complete
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">{selectedVaccine.vaccine_name}</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date Administered
                  </label>
                  <input
                    type="date"
                    value={formData.administered_date}
                    onChange={(e) => setFormData({ ...formData, administered_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Administered By (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.administered_by}
                    onChange={(e) => setFormData({ ...formData, administered_by: e.target.value })}
                    placeholder="Dr. Smith"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Batch Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.batch_number}
                    onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                    placeholder="ABC123"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Any reactions or notes..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 min-h-[80px]"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button onClick={handleSaveCompletion} className="flex-1">
                  Save
                </Button>
                <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageTransition>
  )
}
