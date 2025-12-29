'use client'

import { useState, useEffect, FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useActiveBaby } from '@/lib/hooks/useActiveBaby'
import { useAuth } from '@/components/auth/AuthProvider'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import toast from 'react-hot-toast'

export function DiaperForm({ onComplete }: { onComplete?: () => void }) {
  const { activeBaby } = useActiveBaby()
  const { user } = useAuth()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const [isWet, setIsWet] = useState(true)
  const [isDirty, setIsDirty] = useState(false)
  const [time, setTime] = useState('')
  const [notes, setNotes] = useState('')

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

    if (!isWet && !isDirty) {
      toast.error('Please select at least one type (wet or dirty)')
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.from('diaper_changes').insert({
        baby_id: activeBaby.id,
        user_id: user.id,
        changed_at: time,
        is_wet: isWet,
        is_dirty: isDirty,
        notes: notes || null,
      })

      if (error) throw error

      toast.success('Diaper change logged!')

      // Reset form
      setIsWet(true)
      setIsDirty(false)
      setTime(new Date().toISOString().slice(0, 16))
      setNotes('')

      onComplete?.()
    } catch (error: any) {
      toast.error(error.message || 'Failed to log diaper change')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-gradient-to-br from-baby-yellow to-baby-green">
      <form onSubmit={handleSubmit}>
        <h3 className="text-2xl font-bold text-gray-800 mb-6">Log Diaper Change</h3>

        <div className="space-y-4">
          {/* Diaper Type Checkboxes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Diaper Type
            </label>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-4 bg-white rounded-2xl border-2 border-gray-300 cursor-pointer hover:border-primary-500 transition-all">
                <input
                  type="checkbox"
                  checked={isWet}
                  onChange={(e) => setIsWet(e.target.checked)}
                  className="w-5 h-5 text-primary-500 rounded focus:ring-primary-500"
                />
                <span className="flex-1 font-medium text-gray-800">💧 Wet</span>
              </label>

              <label className="flex items-center gap-3 p-4 bg-white rounded-2xl border-2 border-gray-300 cursor-pointer hover:border-primary-500 transition-all">
                <input
                  type="checkbox"
                  checked={isDirty}
                  onChange={(e) => setIsDirty(e.target.checked)}
                  className="w-5 h-5 text-primary-500 rounded focus:ring-primary-500"
                />
                <span className="flex-1 font-medium text-gray-800">💩 Dirty</span>
              </label>
            </div>
          </div>

          {/* Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Time
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

          <Button type="submit" className="w-full" size="lg" isLoading={loading}>
            Log Diaper Change
          </Button>
        </div>
      </form>
    </Card>
  )
}
