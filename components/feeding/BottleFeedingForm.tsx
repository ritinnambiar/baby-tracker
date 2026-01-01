'use client'

import { useState, useEffect, FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useActiveBaby } from '@/lib/hooks/useActiveBaby'
import { useAuth } from '@/components/auth/AuthProvider'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import toast from 'react-hot-toast'

export function BottleFeedingForm({ onComplete }: { onComplete?: () => void }) {
  const { activeBaby } = useActiveBaby()
  const { user } = useAuth()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const [amount, setAmount] = useState('')
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

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.from('feeding_logs').insert({
        baby_id: activeBaby.id,
        user_id: user.id,
        feeding_type: 'bottle',
        amount_ml: parseFloat(amount),
        started_at: time,
        ended_at: time,
        notes: notes || null,
      })

      if (error) throw error

      toast.success('Bottle feeding logged!')

      // Reset form
      setAmount('')
      setTime(new Date().toISOString().slice(0, 16))
      setNotes('')

      onComplete?.()
    } catch (error: any) {
      toast.error(error instanceof Error ? error.message : String(error) || 'Failed to log feeding')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-gradient-to-br from-baby-blue to-baby-green">
      <form onSubmit={handleSubmit}>
        <h3 className="text-2xl font-bold text-gray-800 mb-6">Bottle Feeding</h3>

        <div className="space-y-4">
          <Input
            label="Amount (ml)"
            type="number"
            step="0.1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="120"
            required
          />

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

          <Input
            label="Notes (Optional)"
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional notes..."
          />

          <Button type="submit" className="w-full" size="lg" isLoading={loading}>
            Log Bottle Feeding
          </Button>
        </div>
      </form>
    </Card>
  )
}
