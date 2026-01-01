'use client'

import { useState, useEffect, FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useActiveBaby } from '@/lib/hooks/useActiveBaby'
import { useAuth } from '@/components/auth/AuthProvider'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { ImageUpload } from '@/components/ui/ImageUpload'
import toast from 'react-hot-toast'

export function GrowthForm({ onComplete }: { onComplete?: () => void }) {
  const { activeBaby } = useActiveBaby()
  const { user } = useAuth()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [headCircumference, setHeadCircumference] = useState('')
  const [time, setTime] = useState('')
  const [notes, setNotes] = useState('')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)

  // Set default time on client side only to avoid hydration mismatch
  useEffect(() => {
    if (!time) {
      const now = new Date()
      setTime(now.toISOString().slice(0, 16))
    }
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!activeBaby || !user) {
      toast.error('Please select a baby first')
      return
    }

    // At least one measurement is required
    if (!weight && !height && !headCircumference) {
      toast.error('Please enter at least one measurement')
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.from('growth_measurements').insert({
        baby_id: activeBaby.id,
        user_id: user.id,
        measured_at: time,
        weight_kg: weight ? parseFloat(weight) : null,
        height_cm: height ? parseFloat(height) : null,
        head_circumference_cm: headCircumference ? parseFloat(headCircumference) : null,
        notes: notes || null,
        photo_url: photoUrl || null,
      })

      if (error) throw error

      toast.success('Growth measurement logged!')

      // Reset form
      setWeight('')
      setHeight('')
      setHeadCircumference('')
      setTime(new Date().toISOString().slice(0, 16))
      setNotes('')
      setPhotoUrl(null)

      onComplete?.()
    } catch (error: any) {
      toast.error(error instanceof Error ? error.message : String(error) || 'Failed to log measurement')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-gradient-to-br from-baby-green to-baby-blue">
      <form onSubmit={handleSubmit}>
        <h3 className="text-2xl font-bold text-gray-800 mb-6">Log Growth Measurement</h3>

        <div className="space-y-4">
          {/* Weight */}
          <Input
            label="Weight (kg)"
            type="number"
            step="0.01"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="3.5"
          />

          {/* Height */}
          <Input
            label="Height (cm)"
            type="number"
            step="0.1"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            placeholder="50"
          />

          {/* Head Circumference */}
          <Input
            label="Head Circumference (cm)"
            type="number"
            step="0.1"
            value={headCircumference}
            onChange={(e) => setHeadCircumference(e.target.value)}
            placeholder="35"
          />

          {/* Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Measured At
            </label>
            <input
              type="datetime-local"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              max={new Date().toISOString().slice(0, 16)}
              required
              className="w-full px-4 py-3 rounded-2xl border-2 border-gray-300 bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 min-h-[48px]"
            />
          </div>

          {/* Notes */}
          <Input
            label="Notes (Optional)"
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional notes..."
          />

          {user && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Photo (Optional)
              </label>
              <ImageUpload
                userId={user.id}
                onUploadComplete={setPhotoUrl}
                currentImageUrl={photoUrl}
                onRemove={() => setPhotoUrl(null)}
                label="Add Photo"
              />
            </div>
          )}

          <Button type="submit" className="w-full" size="lg" isLoading={loading}>
            Log Measurement
          </Button>
        </div>
      </form>
    </Card>
  )
}
