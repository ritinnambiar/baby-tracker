'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { useActiveBaby } from '@/lib/hooks/useActiveBaby'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PageTransition } from '@/components/ui/PageTransition'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { format, parseISO } from 'date-fns'
import { Plus, Calendar, Clock } from 'lucide-react'
import { COMMON_MEDICATIONS, getCategoryLabel } from '@/lib/constants/medications'

interface Medication {
  id: string
  baby_id: string
  medication_name: string
  dosage: string | null
  unit: string | null
  frequency: string | null
  start_date: string
  end_date: string | null
  notes: string | null
  is_active: boolean
}

interface MedicationLog {
  id: string
  medication_id: string
  administered_at: string
  dosage_given: string
  notes: string | null
  photo_url: string | null
  medications: Medication
}

export default function MedicationsPage() {
  const { user, loading: authLoading } = useAuth()
  const { activeBaby, loading: babiesLoading } = useActiveBaby()
  const router = useRouter()
  const supabase = createClient()
  const [medications, setMedications] = useState<Medication[]>([])
  const [recentLogs, setRecentLogs] = useState<MedicationLog[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showLogForm, setShowLogForm] = useState(false)
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
  }, [user, router])

  useEffect(() => {
    const fetchData = async () => {
      if (!activeBaby) {
        setLoading(false)
        return
      }

      try {
        // Fetch active medications
        const { data: medsData, error: medsError } = await supabase
          .from('medications')
          .select('*')
          .eq('baby_id', activeBaby.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false })

        if (medsError) throw medsError

        // Fetch recent medication logs
        const { data: logsData, error: logsError } = await supabase
          .from('medication_logs')
          .select('*, medications(*)')
          .eq('baby_id', activeBaby.id)
          .order('administered_at', { ascending: false })
          .limit(10)

        if (logsError) throw logsError

        setMedications(medsData || [])
        setRecentLogs(logsData || [])
      } catch (error) {
        console.error('Error fetching medications:', error)
        toast.error('Failed to load medications')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [activeBaby, supabase])

  const handleQuickLog = (medication: Medication) => {
    setSelectedMedication(medication)
    setShowLogForm(true)
  }

  const handleStopMedication = async (id: string) => {
    if (!confirm('Mark this medication as stopped?')) return

    try {
      const { error } = await supabase
        .from('medications')
        .update({ is_active: false, end_date: new Date().toISOString().split('T')[0] })
        .eq('id', id)

      if (error) throw error

      toast.success('Medication stopped')

      // Refresh
      const { data } = await supabase
        .from('medications')
        .select('*')
        .eq('baby_id', activeBaby!.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      setMedications(data || [])
    } catch (error) {
      console.error('Error stopping medication:', error)
      toast.error('Failed to stop medication')
    }
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

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-baby-pink via-baby-blue to-baby-yellow p-4 md:p-8 page-content-mobile">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link href="/dashboard" className="text-primary-600 dark:text-primary-400 hover:underline text-sm mb-2 inline-block">
              ← Back to Dashboard
            </Link>
            <h1 className="text-4xl font-bold text-primary-500 mb-2">💊 Medications & Health</h1>
            {activeBaby && (
              <p className="text-gray-600 dark:text-gray-400">
                Tracking for {activeBaby.name}
              </p>
            )}
          </div>

          {!activeBaby ? (
            <Card>
              <div className="text-center py-12">
                <div className="text-6xl mb-4">👶</div>
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                  Please add a baby profile to track medications
                </p>
                <Link href="/settings">
                  <Button>Add Baby</Button>
                </Link>
              </div>
            </Card>
          ) : (
            <>
              {/* Active Medications */}
              <Card className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Active Medications</h2>
                  <Button onClick={() => setShowAddForm(true)} size="sm">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Medication
                  </Button>
                </div>

                {loading ? (
                  <LoadingSpinner text="Loading medications..." />
                ) : medications.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600 dark:text-gray-400 mb-4">No active medications</p>
                    <Button onClick={() => setShowAddForm(true)}>
                      Add First Medication
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {medications.map((med) => (
                      <div
                        key={med.id}
                        className="p-4 bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-800 dark:text-gray-200">{med.medication_name}</h3>
                            {med.dosage && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {med.dosage} {med.unit || ''} {med.frequency && `• ${med.frequency}`}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                              Started: {format(parseISO(med.start_date), 'MMM d, yyyy')}
                            </p>
                            {med.notes && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 italic">{med.notes}</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleQuickLog(med)}>
                              Log Dose
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStopMedication(med.id)}
                            >
                              Stop
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Recent Logs */}
              {recentLogs.length > 0 && (
                <Card>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">Recent Doses</h2>
                  <div className="space-y-2">
                    {recentLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-gray-800 dark:text-gray-200">
                              {log.medications.medication_name}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {log.dosage_given} • {format(parseISO(log.administered_at), 'MMM d, h:mm a')}
                            </p>
                            {log.notes && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 italic">{log.notes}</p>
                            )}
                          </div>
                          {log.photo_url && (
                            <img
                              src={log.photo_url}
                              alt="Medication"
                              className="w-16 h-16 object-cover rounded-lg ml-3"
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      </div>

      {/* Add Medication Modal */}
      {showAddForm && activeBaby && user && (
        <MedicationFormModal
          isOpen={showAddForm}
          onClose={() => setShowAddForm(false)}
          babyId={activeBaby.id}
          userId={user.id}
          onSuccess={() => {
            setShowAddForm(false)
            // Refresh medications
            supabase
              .from('medications')
              .select('*')
              .eq('baby_id', activeBaby.id)
              .eq('is_active', true)
              .order('created_at', { ascending: false })
              .then(({ data }) => setMedications(data || []))
          }}
        />
      )}

      {/* Log Dose Modal */}
      {showLogForm && selectedMedication && activeBaby && user && (
        <LogDoseModal
          isOpen={showLogForm}
          onClose={() => {
            setShowLogForm(false)
            setSelectedMedication(null)
          }}
          medication={selectedMedication}
          babyId={activeBaby.id}
          userId={user.id}
          onSuccess={() => {
            setShowLogForm(false)
            setSelectedMedication(null)
            // Refresh logs
            supabase
              .from('medication_logs')
              .select('*, medications(*)')
              .eq('baby_id', activeBaby.id)
              .order('administered_at', { ascending: false })
              .limit(10)
              .then(({ data }) => setRecentLogs(data || []))
          }}
        />
      )}
    </PageTransition>
  )
}

// Medication Form Modal Component
function MedicationFormModal({ isOpen, onClose, babyId, userId, onSuccess }: {
  isOpen: boolean
  onClose: () => void
  babyId: string
  userId: string
  onSuccess: () => void
}) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [showCommonMeds, setShowCommonMeds] = useState(false)
  const [formData, setFormData] = useState({
    medication_name: '',
    dosage: '',
    unit: 'ml',
    frequency: '',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
  })

  const selectCommonMedication = (med: any) => {
    setFormData({
      ...formData,
      medication_name: med.name,
      dosage: med.commonDosage || '',
      unit: med.unit,
      notes: med.notes || '',
    })
    setShowCommonMeds(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.from('medications').insert({
        baby_id: babyId,
        user_id: userId,
        medication_name: formData.medication_name,
        dosage: formData.dosage || null,
        unit: formData.unit || null,
        frequency: formData.frequency || null,
        start_date: formData.start_date,
        notes: formData.notes || null,
        is_active: true,
      })

      if (error) throw error

      toast.success('Medication added!')
      onSuccess()
    } catch (error: any) {
      toast.error(error.message || 'Failed to add medication')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">
            Add Medication
          </h3>

          {!showCommonMeds ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCommonMeds(true)}
                  className="w-full mb-2"
                >
                  Choose from Common Medications
                </Button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Medication Name *
                </label>
                <input
                  type="text"
                  value={formData.medication_name}
                  onChange={(e) => setFormData({ ...formData, medication_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200"
                  required
                />
              </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Dosage
                </label>
                <input
                  type="text"
                  value={formData.dosage}
                  onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                  placeholder="5"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Unit
                </label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200"
                >
                  <option value="ml">ml</option>
                  <option value="mg">mg</option>
                  <option value="drops">drops</option>
                  <option value="tablets">tablets</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Frequency
              </label>
              <input
                type="text"
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                placeholder="e.g., twice daily, every 6 hours"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Date *
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional information..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 min-h-[80px] bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200"
              />
            </div>

            <div className="flex gap-3 mt-6">
              <Button type="submit" className="flex-1" isLoading={loading}>
                Add Medication
              </Button>
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
            </div>
          </form>
          ) : (
            <div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCommonMeds(false)}
                className="mb-4"
              >
                ← Back to Form
              </Button>
              <div className="space-y-2">
                {COMMON_MEDICATIONS.map((med, idx) => (
                  <button
                    key={idx}
                    onClick={() => selectCommonMedication(med)}
                    className="w-full text-left p-3 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div className="font-medium text-gray-800 dark:text-gray-200">
                      {med.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {getCategoryLabel(med.category)}
                      {med.commonDosage && ` • ${med.commonDosage} ${med.unit}`}
                    </div>
                    {med.notes && (
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 italic">
                        {med.notes}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Log Dose Modal Component
function LogDoseModal({ isOpen, onClose, medication, babyId, userId, onSuccess }: {
  isOpen: boolean
  onClose: () => void
  medication: Medication
  babyId: string
  userId: string
  onSuccess: () => void
}) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    administered_at: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    dosage_given: medication.dosage || '',
    notes: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.from('medication_logs').insert({
        medication_id: medication.id,
        baby_id: babyId,
        user_id: userId,
        administered_at: formData.administered_at,
        dosage_given: formData.dosage_given,
        notes: formData.notes || null,
        photo_url: photoUrl,
      })

      if (error) throw error

      toast.success('Dose logged!')
      onSuccess()
    } catch (error: any) {
      toast.error(error.message || 'Failed to log dose')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full p-6">
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">
            Log Dose
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{medication.medication_name}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Time Given *
              </label>
              <input
                type="datetime-local"
                value={formData.administered_at}
                onChange={(e) => setFormData({ ...formData, administered_at: e.target.value })}
                max={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Dosage Given *
              </label>
              <input
                type="text"
                value={formData.dosage_given}
                onChange={(e) => setFormData({ ...formData, dosage_given: e.target.value })}
                placeholder={`e.g., ${medication.dosage || '5'} ${medication.unit || 'ml'}`}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any notes about this dose..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 min-h-[80px] bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200"
              />
            </div>

            <div className="flex gap-3 mt-6">
              <Button type="submit" className="flex-1" isLoading={loading}>
                Log Dose
              </Button>
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
