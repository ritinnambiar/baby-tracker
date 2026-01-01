'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { useActiveBaby } from '@/lib/hooks/useActiveBaby'
import { useTheme } from '@/lib/hooks/useTheme'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PageTransition } from '@/components/ui/PageTransition'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ImageUpload } from '@/components/ui/ImageUpload'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { format, parseISO, differenceInMonths } from 'date-fns'
import { Plus } from 'lucide-react'
import { MILESTONE_CATEGORIES, COMMON_MILESTONES, getCategoryEmoji, getCategoryLabel } from '@/lib/constants/milestones'

interface Milestone {
  id: string
  baby_id: string
  milestone_title: string
  milestone_category: string
  achieved_date: string
  age_months: number | null
  description: string | null
  photo_url: string | null
  notes: string | null
}

export default function MilestonesPage() {
  const { currentTheme } = useTheme()
  const { user, loading: authLoading } = useAuth()
  const { activeBaby, loading: babiesLoading } = useActiveBaby()
  const router = useRouter()
  const supabase = createClient()
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null)
  const [completionFormData, setCompletionFormData] = useState({
    achieved_date: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
  })

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
  }, [user, router])

  useEffect(() => {
    const fetchMilestones = async () => {
      if (!activeBaby) {
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('milestones')
          .select('*')
          .eq('baby_id', activeBaby.id)
          .order('achieved_date', { ascending: false })

        if (error) throw error

        setMilestones(data || [])
      } catch (error) {
        console.error('Error fetching milestones:', error)
        toast.error('Failed to load milestones')
      } finally {
        setLoading(false)
      }
    }

    fetchMilestones()
  }, [activeBaby, supabase])

  const filteredMilestones =
    selectedCategory === 'all'
      ? milestones
      : milestones.filter((m) => m.milestone_category === selectedCategory)

  const achievedMilestones = filteredMilestones.filter(m => m.achieved_date)
  const pendingMilestones = filteredMilestones.filter(m => !m.achieved_date)

  const groupedByCategory = MILESTONE_CATEGORIES.map((cat) => ({
    ...cat,
    milestones: milestones.filter((m) => m.milestone_category === cat.value),
  }))

  const babyAgeMonths = activeBaby
    ? differenceInMonths(new Date(), parseISO(activeBaby.date_of_birth))
    : 0

  const initializeMilestones = async () => {
    if (!activeBaby || !user) return

    setLoading(true)
    try {
      // Insert all common milestones as NOT achieved
      const milestonesData = COMMON_MILESTONES.map(milestone => ({
        baby_id: activeBaby.id,
        user_id: user.id,
        milestone_title: milestone.title,
        milestone_category: milestone.category,
        achieved_date: null, // Not achieved yet
        age_months: null,
        description: milestone.description,
        notes: `Age range: ${milestone.ageMonthsMin}-${milestone.ageMonthsMax} months`,
      }))

      const { error } = await supabase
        .from('milestones')
        .insert(milestonesData)

      if (error) {
        if (error.message.includes('relation') || error.message.includes('does not exist')) {
          toast.error('Please apply database migrations first. See dashboard for instructions.')
        } else {
          toast.error(`Failed to initialize: ${error.message}`)
        }
        throw error
      }

      toast.success('Milestones initialized! Mark them as achieved when your baby reaches them.')

      // Refresh data
      const { data } = await supabase
        .from('milestones')
        .select('*')
        .eq('baby_id', activeBaby.id)
        .order('achieved_date', { ascending: false })

      setMilestones(data || [])
    } catch (error: any) {
      // Error already shown in toast above
    } finally {
      setLoading(false)
    }
  }

  const handleMarkComplete = async (milestone: Milestone) => {
    setSelectedMilestone(milestone)
    setShowCompletionModal(true)
  }

  const handleSaveCompletion = async () => {
    if (!selectedMilestone || !activeBaby) return

    try {
      const ageMonths = differenceInMonths(parseISO(completionFormData.achieved_date), parseISO(activeBaby.date_of_birth))

      const { error } = await supabase
        .from('milestones')
        .update({
          achieved_date: completionFormData.achieved_date,
          age_months: ageMonths,
          notes: completionFormData.notes || null,
        })
        .eq('id', selectedMilestone.id)

      if (error) throw error

      toast.success('Milestone marked as achieved! 🎉')
      setShowCompletionModal(false)
      setSelectedMilestone(null)
      setCompletionFormData({
        achieved_date: format(new Date(), 'yyyy-MM-dd'),
        notes: '',
      })

      // Refresh data
      const { data } = await supabase
        .from('milestones')
        .select('*')
        .eq('baby_id', activeBaby.id)
        .order('achieved_date', { ascending: false })

      setMilestones(data || [])
    } catch (error) {
      toast.error('Failed to mark milestone as complete')
    }
  }

  const handleUndoCompletion = async (id: string) => {
    try {
      const { error } = await supabase
        .from('milestones')
        .update({
          achieved_date: null,
          age_months: null,
        })
        .eq('id', id)

      if (error) throw error

      toast.success('Milestone unmarked')

      // Refresh data
      const { data } = await supabase
        .from('milestones')
        .select('*')
        .eq('baby_id', activeBaby.id)
        .order('achieved_date', { ascending: false })

      setMilestones(data || [])
    } catch (error) {
      toast.error('Failed to undo milestone')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this milestone?')) return

    try {
      const { error } = await supabase.from('milestones').delete().eq('id', id)

      if (error) throw error

      toast.success('Milestone deleted')
      setMilestones((prev) => prev.filter((m) => m.id !== id))
    } catch (error) {
      toast.error('Failed to delete milestone')
    }
  }

  if (authLoading || babiesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: currentTheme.gradientCSS }}>
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <PageTransition>
      <div className="min-h-screen p-4 md:p-8 page-content-mobile" style={{ background: currentTheme.gradientCSS }}>
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/dashboard"
              className="text-yellow-600 dark:text-yellow-400 hover:underline text-sm mb-2 inline-block font-semibold"
            >
              ← Back to Dashboard
            </Link>
            <h1 className="text-4xl font-bold text-yellow-800 mb-2 drop-shadow-md">🎯 Milestones</h1>
            {activeBaby && (
              <p className="text-gray-800 font-medium dark:text-gray-400">
                <span className="text-yellow-700 font-bold">{activeBaby.name}</span> • {babyAgeMonths} months old
              </p>
            )}
          </div>

          {!activeBaby ? (
            <Card>
              <div className="text-center py-12">
                <div className="text-6xl mb-4">👶</div>
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                  Please add a baby profile to track milestones
                </p>
                <Link href="/settings">
                  <Button>Add Baby</Button>
                </Link>
              </div>
            </Card>
          ) : milestones.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🎯</div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">
                  Set Up Milestone Tracking
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                  Initialize common developmental milestones for {activeBaby.name}. You can add custom milestones anytime.
                </p>
                <Button size="lg" onClick={initializeMilestones} disabled={loading}>
                  {loading ? 'Setting up...' : 'Initialize Milestones'}
                </Button>
              </div>
            </Card>
          ) : (
            <>
              {/* Add Milestone Button */}
              <div className="mb-6">
                <Button onClick={() => setShowAddForm(true)} size="lg" className="w-full md:w-auto">
                  <Plus className="w-5 h-5 mr-2" />
                  Add Custom Milestone
                </Button>
              </div>

              {/* Category Filter Tabs */}
              <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === 'all'
                      ? 'bg-primary-500 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  All ({milestones.length})
                </button>
                {MILESTONE_CATEGORIES.map((cat) => {
                  const count = milestones.filter((m) => m.milestone_category === cat.value).length
                  return (
                    <button
                      key={cat.value}
                      onClick={() => setSelectedCategory(cat.value)}
                      className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                        selectedCategory === cat.value
                          ? 'bg-primary-500 text-white'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      {cat.emoji} {cat.label} ({count})
                    </button>
                  )
                })}
              </div>

              {/* Milestones List */}
              {loading ? (
                <LoadingSpinner text="Loading milestones..." />
              ) : filteredMilestones.length === 0 ? (
                <Card>
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🎯</div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">
                      {selectedCategory === 'all' ? 'No Milestones Yet' : `No ${getCategoryLabel(selectedCategory)} Milestones`}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-8">
                      Track your baby's developmental milestones and celebrate their growth!
                    </p>
                    <Button onClick={() => setShowAddForm(true)}>Add First Milestone</Button>
                  </div>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredMilestones.map((milestone) => (
                    <Card key={milestone.id}>
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-2xl">{getCategoryEmoji(milestone.milestone_category)}</span>
                                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                                  {milestone.milestone_title}
                                </h3>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {getCategoryLabel(milestone.milestone_category)}
                                {milestone.achieved_date && (
                                  <> • {format(parseISO(milestone.achieved_date), 'MMM d, yyyy')}</>
                                )}
                                {milestone.age_months !== null && ` • ${milestone.age_months} months old`}
                                {!milestone.achieved_date && <> • <span className="text-amber-600 dark:text-amber-400 font-medium">Not achieved yet</span></>}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant={milestone.achieved_date ? 'outline' : 'primary'}
                              onClick={() => milestone.achieved_date ? handleUndoCompletion(milestone.id) : handleMarkComplete(milestone)}
                            >
                              {milestone.achieved_date ? 'Undo' : 'Mark Complete'}
                            </Button>
                          </div>
                          {milestone.description && (
                            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                              {milestone.description}
                            </p>
                          )}
                          {milestone.notes && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                              Note: {milestone.notes}
                            </p>
                          )}
                        </div>
                        {milestone.photo_url && (
                          <img
                            src={milestone.photo_url}
                            alt={milestone.milestone_title}
                            className="w-24 h-24 object-cover rounded-xl"
                          />
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {/* Summary by Category */}
              {milestones.length > 0 && (
                <Card className="mt-8">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">
                    Summary by Category
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {groupedByCategory.map((cat) => (
                      <div
                        key={cat.value}
                        className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-xl"
                      >
                        <div className="text-3xl mb-2">{cat.emoji}</div>
                        <div className="text-2xl font-bold text-primary-500">
                          {cat.milestones.length}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{cat.label}</div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      </div>

      {/* Add Milestone Modal */}
      {showAddForm && activeBaby && user && (
        <MilestoneFormModal
          isOpen={showAddForm}
          onClose={() => setShowAddForm(false)}
          babyId={activeBaby.id}
          userId={user.id}
          babyDOB={activeBaby.date_of_birth}
          onSuccess={() => {
            setShowAddForm(false)
            // Refresh milestones
            supabase
              .from('milestones')
              .select('*')
              .eq('baby_id', activeBaby.id)
              .order('achieved_date', { ascending: false })
              .then(({ data }) => setMilestones(data || []))
          }}
        />
      )}

      {/* Completion Modal */}
      {showCompletionModal && selectedMilestone && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowCompletionModal(false)} />
          <div className="relative min-h-screen flex items-center justify-center p-4">
            <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">
                Mark Milestone Complete
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">{selectedMilestone.milestone_title}</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date Achieved
                  </label>
                  <input
                    type="date"
                    value={completionFormData.achieved_date}
                    onChange={(e) => setCompletionFormData({ ...completionFormData, achieved_date: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={completionFormData.notes}
                    onChange={(e) => setCompletionFormData({ ...completionFormData, notes: e.target.value })}
                    placeholder="Add any notes about this achievement..."
                    rows={3}
                    className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowCompletionModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSaveCompletion}
                >
                  Save
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageTransition>
  )
}

// Milestone Form Modal Component
function MilestoneFormModal({
  isOpen,
  onClose,
  babyId,
  userId,
  babyDOB,
  onSuccess,
}: {
  isOpen: boolean
  onClose: () => void
  babyId: string
  userId: string
  babyDOB: string
  onSuccess: () => void
}) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [showCommonMilestones, setShowCommonMilestones] = useState(false)
  const [formData, setFormData] = useState({
    milestone_title: '',
    milestone_category: 'physical',
    achieved_date: format(new Date(), 'yyyy-MM-dd'),
    description: '',
    notes: '',
  })

  const ageMonths = differenceInMonths(
    parseISO(formData.achieved_date),
    parseISO(babyDOB)
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.from('milestones').insert({
        baby_id: babyId,
        user_id: userId,
        milestone_title: formData.milestone_title,
        milestone_category: formData.milestone_category,
        achieved_date: formData.achieved_date,
        age_months: ageMonths,
        description: formData.description || null,
        notes: formData.notes || null,
        photo_url: photoUrl,
      })

      if (error) throw error

      toast.success('Milestone added!')
      onSuccess()
    } catch (error: any) {
      toast.error(error.message || 'Failed to add milestone')
    } finally {
      setLoading(false)
    }
  }

  const selectCommonMilestone = (milestone: any) => {
    setFormData({
      ...formData,
      milestone_title: milestone.title,
      milestone_category: milestone.category,
      description: milestone.description,
    })
    setShowCommonMilestones(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">
            Add Milestone
          </h3>

          {!showCommonMilestones ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCommonMilestones(true)}
                  className="w-full mb-2"
                >
                  Choose from Common Milestones
                </Button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Milestone Title *
                </label>
                <input
                  type="text"
                  value={formData.milestone_title}
                  onChange={(e) =>
                    setFormData({ ...formData, milestone_title: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200"
                  placeholder="e.g., First steps"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category *
                </label>
                <select
                  value={formData.milestone_category}
                  onChange={(e) =>
                    setFormData({ ...formData, milestone_category: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200"
                  required
                >
                  {MILESTONE_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.emoji} {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date Achieved *
                </label>
                <input
                  type="date"
                  value={formData.achieved_date}
                  onChange={(e) =>
                    setFormData({ ...formData, achieved_date: e.target.value })
                  }
                  max={format(new Date(), 'yyyy-MM-dd')}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200"
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Age: {ageMonths} months
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What happened..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 min-h-[60px] bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 min-h-[60px] bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Photo (Optional)
                </label>
                <ImageUpload
                  userId={userId}
                  onUploadComplete={setPhotoUrl}
                  currentImageUrl={photoUrl}
                  onRemove={() => setPhotoUrl(null)}
                  label="Add Photo"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <Button type="submit" className="flex-1" isLoading={loading}>
                  Add Milestone
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
                onClick={() => setShowCommonMilestones(false)}
                className="mb-4"
              >
                ← Back to Form
              </Button>
              <div className="space-y-2">
                {COMMON_MILESTONES.map((milestone, idx) => (
                  <button
                    key={idx}
                    onClick={() => selectCommonMilestone(milestone)}
                    className="w-full text-left p-3 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-xl">{getCategoryEmoji(milestone.category)}</span>
                      <div className="flex-1">
                        <div className="font-medium text-gray-800 dark:text-gray-200">
                          {milestone.title}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {getCategoryLabel(milestone.category)} • {milestone.ageMonthsMin}-
                          {milestone.ageMonthsMax} months
                        </div>
                      </div>
                    </div>
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
