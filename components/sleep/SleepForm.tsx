'use client'

import { useState, useEffect, FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useActiveBaby } from '@/lib/hooks/useActiveBaby'
import { useAuth } from '@/components/auth/AuthProvider'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { ImageUpload } from '@/components/ui/ImageUpload'
import { SleepType } from '@/lib/types/sleep'
import toast from 'react-hot-toast'

export function SleepForm({ onComplete }: { onComplete?: () => void }) {
  const { activeBaby } = useActiveBaby()
  const { user } = useAuth()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const [sleepType, setSleepType] = useState<SleepType>('nap')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [notes, setNotes] = useState('')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)

  // Set default times on client side only to avoid hydration mismatch
  useEffect(() => {
    if (!startTime) {
      const now = new Date()
      now.setHours(now.getHours() - 2)
      setStartTime(now.toISOString().slice(0, 16))
    }
    if (!endTime) {
      const now = new Date()
      setEndTime(now.toISOString().slice(0, 16))
    }
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!activeBaby || !user) {
      toast.error('Please select a baby first')
      return
    }

    const start = new Date(startTime)
    const end = new Date(endTime)

    if (end <= start) {
      toast.error('End time must be after start time')
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.from('sleep_logs').insert({
        baby_id: activeBaby.id,
        user_id: user.id,
        sleep_type: sleepType,
        started_at: start.toISOString(),
        ended_at: end.toISOString(),
        notes: notes || null,
        photo_url: photoUrl || null,
      })

      if (error) throw error

      toast.success('Sleep session logged!')

      // Reset form
      const now = new Date()
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)
      setStartTime(twoHoursAgo.toISOString().slice(0, 16))
      setEndTime(now.toISOString().slice(0, 16))
      setNotes('')
      setPhotoUrl(null)

      onComplete?.()
    } catch (error: any) {
      toast.error(error.message || 'Failed to log sleep')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-gradient-to-br from-baby-yellow to-baby-green">
      <form onSubmit={handleSubmit}>
        <h3 className="text-2xl font-bold text-gray-800 mb-6">Manual Sleep Entry</h3>

        <div className="space-y-4">
          {/* Sleep Type Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sleep Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSleepType('nap')}
                className={`py-3 px-4 rounded-2xl border-2 font-semibold transition-all ${
                  sleepType === 'nap'
                    ? 'bg-gray-800 text-white border-gray-800'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                }`}
              >
                😴 Nap
              </button>
              <button
                type="button"
                onClick={() => setSleepType('night')}
                className={`py-3 px-4 rounded-2xl border-2 font-semibold transition-all ${
                  sleepType === 'night'
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                }`}
              >
                🌙 Night
              </button>
            </div>
          </div>

          {/* Start Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Start Time
            </label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              max={new Date().toISOString().slice(0, 16)}
              required
              className="w-full px-4 py-3 rounded-2xl border-2 border-gray-300 bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 min-h-[48px]"
            />
          </div>

          {/* End Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              End Time
            </label>
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
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
            Log Sleep Session
          </Button>
        </div>
      </form>
    </Card>
  )
}
