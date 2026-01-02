'use client'

import { useState, useEffect, FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useActiveBaby } from '@/lib/hooks/useActiveBaby'
import { useAuth } from '@/components/auth/AuthProvider'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import toast from 'react-hot-toast'

export function PumpingForm({ onComplete }: { onComplete?: () => void }) {
  const { activeBaby } = useActiveBaby()
  const { user } = useAuth()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const [leftAmount, setLeftAmount] = useState('')
  const [rightAmount, setRightAmount] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [notes, setNotes] = useState('')

  // Set default times on client side only to avoid hydration mismatch
  useEffect(() => {
    if (!startTime) {
      const now = new Date()
      now.setMinutes(now.getMinutes() - 20)
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

    if (!leftAmount && !rightAmount) {
      toast.error('Please enter at least one amount (left or right)')
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.from('pumping_logs').insert({
        baby_id: activeBaby.id,
        user_id: user.id,
        started_at: startTime,
        ended_at: endTime,
        left_amount_ml: leftAmount ? parseFloat(leftAmount) : null,
        right_amount_ml: rightAmount ? parseFloat(rightAmount) : null,
        notes: notes || null,
      })

      if (error) throw error

      toast.success('Pumping session logged!')

      // Reset form
      setLeftAmount('')
      setRightAmount('')
      const now = new Date()
      const twentyMinutesAgo = new Date(now.getTime() - 20 * 60 * 1000)
      setStartTime(twentyMinutesAgo.toISOString().slice(0, 16))
      setEndTime(now.toISOString().slice(0, 16))
      setNotes('')

      onComplete?.()
    } catch (error: any) {
      toast.error(error instanceof Error ? error.message : String(error) || 'Failed to log pumping session')
    } finally {
      setLoading(false)
    }
  }

  const totalAmount = (parseFloat(leftAmount) || 0) + (parseFloat(rightAmount) || 0)

  return (
    <Card className="bg-gradient-to-br from-baby-purple to-baby-pink">
      <form onSubmit={handleSubmit}>
        <h3 className="text-2xl font-bold !text-black mb-6">Log Pumping Session</h3>

        <div className="space-y-4">
          {/* Amount Inputs */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Left Breast (ml)"
              type="number"
              step="0.1"
              value={leftAmount}
              onChange={(e) => setLeftAmount(e.target.value)}
              placeholder="60"
            />
            <Input
              label="Right Breast (ml)"
              type="number"
              step="0.1"
              value={rightAmount}
              onChange={(e) => setRightAmount(e.target.value)}
              placeholder="60"
            />
          </div>

          {/* Total Display */}
          {totalAmount > 0 && (
            <div className="bg-white rounded-2xl p-4 text-center">
              <div className="text-sm text-gray-600 mb-1">Total Amount</div>
              <div className="text-3xl font-bold text-primary-600">{totalAmount} ml</div>
            </div>
          )}

          {/* Start Time */}
          <div>
            <label className="block text-sm font-medium !text-black mb-1.5">
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
            <label className="block text-sm font-medium !text-black mb-1.5">
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

          <Button type="submit" className="w-full" size="lg" isLoading={loading}>
            Log Pumping Session
          </Button>
        </div>
      </form>
    </Card>
  )
}
