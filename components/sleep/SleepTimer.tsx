'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useActiveBaby } from '@/lib/hooks/useActiveBaby'
import { useAuth } from '@/components/auth/AuthProvider'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { SleepTimerState, SleepType } from '@/lib/types/sleep'
import toast from 'react-hot-toast'

const STORAGE_KEY = 'sleep_timer_state'

export function SleepTimer({ onComplete }: { onComplete?: () => void }) {
  const { activeBaby } = useActiveBaby()
  const { user } = useAuth()
  const supabase = createClient()

  const [timerState, setTimerState] = useState<SleepTimerState>({
    isActive: false,
    sleepType: 'nap',
    startedAt: null,
    lastUpdated: Date.now(),
  })

  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  // Load timer state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsedState: SleepTimerState = JSON.parse(saved)
        if (parsedState.isActive && parsedState.startedAt) {
          // Calculate elapsed time since start
          const startTime = new Date(parsedState.startedAt).getTime()
          const elapsed = Math.floor((Date.now() - startTime) / 1000)
          setElapsedSeconds(elapsed)
        }
        parsedState.lastUpdated = Date.now()
        setTimerState(parsedState)
      } catch (error) {
        console.error('Error loading timer state:', error)
      }
    }
  }, [])

  // Save timer state to localStorage whenever it changes
  useEffect(() => {
    if (timerState.isActive || timerState.startedAt) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(timerState))
    }
  }, [timerState])

  // Update timer every second when active
  useEffect(() => {
    if (!timerState.isActive || !timerState.startedAt) return

    const interval = setInterval(() => {
      const startTime = new Date(timerState.startedAt!).getTime()
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      setElapsedSeconds(elapsed)
    }, 1000)

    return () => clearInterval(interval)
  }, [timerState.isActive, timerState.startedAt])

  const startSleep = (type: SleepType) => {
    const now = new Date().toISOString()
    setTimerState({
      isActive: true,
      sleepType: type,
      startedAt: now,
      lastUpdated: Date.now(),
    })
    setElapsedSeconds(0)
  }

  const endSleep = async () => {
    if (!activeBaby || !user || !timerState.startedAt) {
      toast.error('Cannot save sleep session')
      return
    }

    try {
      const endTime = new Date()

      const { error } = await supabase.from('sleep_logs').insert({
        baby_id: activeBaby.id,
        user_id: user.id,
        sleep_type: timerState.sleepType,
        started_at: timerState.startedAt,
        ended_at: endTime.toISOString(),
      })

      if (error) throw error

      toast.success('Sleep session saved!')

      // Reset timer
      setTimerState({
        isActive: false,
        sleepType: 'nap',
        startedAt: null,
        lastUpdated: Date.now(),
      })
      setElapsedSeconds(0)
      localStorage.removeItem(STORAGE_KEY)

      onComplete?.()
    } catch (error: any) {
      toast.error(error instanceof Error ? error.message : String(error) || 'Failed to save sleep session')
    }
  }

  const cancelSleep = () => {
    if (confirm('Are you sure you want to cancel this sleep session?')) {
      setTimerState({
        isActive: false,
        sleepType: 'nap',
        startedAt: null,
        lastUpdated: Date.now(),
      })
      setElapsedSeconds(0)
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Card className="bg-gradient-to-br from-baby-blue to-baby-purple">
      <div className="text-center">
        <h3 className="text-2xl font-bold !text-black mb-6">Sleep Timer</h3>

        {!timerState.isActive ? (
          <div className="space-y-4">
            <p className="!text-black mb-4">Start tracking sleep session</p>
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => startSleep('nap')}
                className="bg-gray-800 hover:bg-gray-700 text-white py-8"
                size="lg"
              >
                <div>
                  <div className="text-4xl mb-2">😴</div>
                  <div className="font-semibold">Nap</div>
                </div>
              </Button>
              <Button
                onClick={() => startSleep('night')}
                className="bg-gray-900 hover:bg-gray-800 text-white py-8"
                size="lg"
              >
                <div>
                  <div className="text-4xl mb-2">🌙</div>
                  <div className="font-semibold">Night Sleep</div>
                </div>
              </Button>
            </div>
          </div>
        ) : (
          <div>
            {/* Active Timer Display */}
            <motion.div
              className="bg-white rounded-2xl p-8 mb-6"
              animate={timerState.isActive ? {
                scale: [1, 1.05, 1],
                boxShadow: [
                  '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  '0 20px 25px -5px rgba(124, 185, 232, 0.3)',
                  '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                ]
              } : {}}
              transition={{
                duration: 1.5,
                repeat: timerState.isActive ? Infinity : 0,
                ease: "easeInOut"
              }}
            >
              <div className="text-sm font-semibold text-gray-600 mb-2 uppercase">
                {timerState.sleepType === 'nap' ? '😴 Nap' : '🌙 Night Sleep'}
              </div>
              <div className="text-6xl font-bold text-primary-600 mb-4">
                {formatTime(elapsedSeconds)}
              </div>
              <div className="text-sm text-gray-600">
                Started: {timerState.startedAt && new Date(timerState.startedAt).toLocaleTimeString()}
              </div>
            </motion.div>

            {/* Controls */}
            <div className="flex gap-3">
              <Button onClick={endSleep} className="flex-1" size="lg">
                End Sleep
              </Button>
              <Button onClick={cancelSleep} variant="outline" size="lg">
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
