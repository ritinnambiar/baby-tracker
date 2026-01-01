'use client'

import { useState } from 'react'
import { useActiveBaby } from '@/lib/hooks/useActiveBaby'
import { useTheme } from '@/lib/hooks/useTheme'
import { createClient } from '@/lib/supabase/client'
import { Baby } from '@/lib/types/baby'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { BabyForm } from '@/components/babies/BabyForm'
import { CaregiverManager } from '@/components/babies/CaregiverManager'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function SettingsPage() {
  const { babies, activeBaby, setActiveBaby, refreshBabies, loading } = useActiveBaby()
  const { currentTheme } = useTheme()
  const supabase = createClient()
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingBaby, setEditingBaby] = useState<Baby | null>(null)
  const [showCaregiversFor, setShowCaregiversFor] = useState<string | null>(null)

  const handleDelete = async (babyId: string) => {
    if (!confirm('Are you sure you want to delete this baby profile? This will also delete all tracking data.')) {
      return
    }

    try {
      const { error } = await supabase.from('babies').delete().eq('id', babyId)

      if (error) throw error

      toast.success('Baby profile deleted')
      await refreshBabies()
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete baby profile')
    }
  }

  const getAgeString = (dateOfBirth: string) => {
    const dob = new Date(dateOfBirth)
    const now = new Date()
    const diffMs = now.getTime() - dob.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays < 30) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} old`
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30)
      return `${months} month${months !== 1 ? 's' : ''} old`
    } else {
      const years = Math.floor(diffDays / 365)
      const months = Math.floor((diffDays % 365) / 30)
      return `${years} year${years !== 1 ? 's' : ''}${months > 0 ? ` ${months} month${months !== 1 ? 's' : ''}` : ''} old`
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: currentTheme.gradientCSS }}>
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-6">
          <div>
            <Link href="/dashboard" className="inline-block">
              <h1 className="text-4xl font-bold text-yellow-800 mb-2 hover:text-yellow-900 transition-colors cursor-pointer drop-shadow-md">
                Baby Tracker 👶
              </h1>
            </Link>
            <p className="text-gray-800 font-medium dark:text-gray-300">Manage your baby's information</p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline" className="border-yellow-600 text-yellow-800 hover:bg-yellow-50 font-semibold">
              ← Back to Dashboard
            </Button>
          </Link>
        </div>

        {/* Add Baby Form */}
        {showAddForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Add New Baby</CardTitle>
            </CardHeader>
            <CardContent>
              <BabyForm
                onSuccess={() => {
                  setShowAddForm(false)
                }}
                onCancel={() => setShowAddForm(false)}
              />
            </CardContent>
          </Card>
        )}

        {/* Edit Baby Form */}
        {editingBaby && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Edit {editingBaby.name}'s Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <BabyForm
                baby={editingBaby}
                onSuccess={() => {
                  setEditingBaby(null)
                }}
                onCancel={() => setEditingBaby(null)}
              />
            </CardContent>
          </Card>
        )}

        {/* Add Baby Button */}
        {!showAddForm && !editingBaby && (
          <Button
            onClick={() => setShowAddForm(true)}
            className="mb-6"
            size="lg"
          >
            + Add New Baby
          </Button>
        )}

        {/* Babies List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {babies.map((baby) => (
            <Card
              key={baby.id}
              className={`${
                activeBaby?.id === baby.id ? 'ring-2 ring-primary-500 shadow-playful' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-800 mb-1">{baby.name}</h3>
                  <p className="text-sm text-gray-600">{getAgeString(baby.date_of_birth)}</p>
                  <p className="text-xs text-gray-500">
                    Born: {format(new Date(baby.date_of_birth), 'MMM d, yyyy')}
                  </p>
                </div>
                <div className="text-4xl">
                  {baby.gender === 'male' ? '👦' : baby.gender === 'female' ? '👧' : '👶'}
                </div>
              </div>

              {baby.birth_weight && (
                <div className="mb-4 grid grid-cols-3 gap-2 text-sm">
                  <div className="bg-baby-pink rounded-xl p-2 text-center">
                    <div className="text-xs text-gray-600">Weight</div>
                    <div className="font-semibold">{baby.birth_weight} kg</div>
                  </div>
                  {baby.birth_height && (
                    <div className="bg-baby-blue rounded-xl p-2 text-center">
                      <div className="text-xs text-gray-600">Height</div>
                      <div className="font-semibold">{baby.birth_height} cm</div>
                    </div>
                  )}
                  {baby.birth_head_circumference && (
                    <div className="bg-baby-yellow rounded-xl p-2 text-center">
                      <div className="text-xs text-gray-600">Head</div>
                      <div className="font-semibold">{baby.birth_head_circumference} cm</div>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <div className="flex gap-2">
                  {activeBaby?.id !== baby.id && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveBaby(baby)}
                      className="flex-1"
                    >
                      Set Active
                    </Button>
                  )}
                  {activeBaby?.id === baby.id && (
                    <div className="flex-1 text-center py-1.5 px-3 bg-primary-50 text-primary-600 rounded-3xl text-sm font-semibold">
                      Active Baby
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingBaby(baby)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(baby.id)}
                    className="text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </Button>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCaregiversFor(showCaregiversFor === baby.id ? null : baby.id)}
                  className="w-full"
                >
                  👥 {showCaregiversFor === baby.id ? 'Hide' : 'Manage'} Caregivers
                </Button>
              </div>

              {/* Caregiver Manager */}
              {showCaregiversFor === baby.id && (
                <div className="mt-4 pt-4 border-t">
                  <CaregiverManager babyId={baby.id} babyName={baby.name} />
                </div>
              )}
            </Card>
          ))}
        </div>

        {babies.length === 0 && !showAddForm && (
          <Card>
            <CardHeader>
              <CardTitle>Add Your First Baby</CardTitle>
            </CardHeader>
            <CardContent>
              <BabyForm
                redirectToDashboard={true}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
