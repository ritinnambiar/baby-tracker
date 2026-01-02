'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useActiveBaby } from '@/lib/hooks/useActiveBaby'
import { useAuth } from '@/components/auth/AuthProvider'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { TimerState, BreastSide } from '@/lib/types/feeding'
import toast from 'react-hot-toast'

const STORAGE_KEY = 'nursing_timer_state'

export function NursingTimer({ onComplete }: { onComplete?: () => void }) {
  const { activeBaby } = useActiveBaby()
  const { user } = useAuth()
  const supabase = createClient()

  const [timerState, setTimerState] = useState<TimerState>({
    isActive: false,
    activeSide: null,
    leftDuration: 0,
    rightDuration: 0,
    startedAt: null,
    lastUpdated: Date.now(),
  })

  // Load timer state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsedState: TimerState = JSON.parse(saved)
        // Calculate elapsed time since last update
        if (parsedState.isActive && parsedState.activeSide) {
          const elapsed = Math.floor((Date.now() - parsedState.lastUpdated) / 1000)
          if (parsedState.activeSide === 'left') {
            parsedState.leftDuration += elapsed
          } else {
            parsedState.rightDuration += elapsed
          }
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
    if (timerState.isActive || timerState.leftDuration > 0 || timerState.rightDuration > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(timerState))
    }
  }, [timerState])

  // Update timer every second when active
  useEffect(() => {
    if (!timerState.isActive || !timerState.activeSide) return

    const interval = setInterval(() => {
      setTimerState((prev) => {
        const newState = { ...prev, lastUpdated: Date.now() }
        if (prev.activeSide === 'left') {
          newState.leftDuration = prev.leftDuration + 1
        } else if (prev.activeSide === 'right') {
          newState.rightDuration = prev.rightDuration + 1
        }
        return newState
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [timerState.isActive, timerState.activeSide])

  const startSide = (side: 'left' | 'right') => {
    setTimerState({
      ...timerState,
      isActive: true,
      activeSide: side,
      startedAt: timerState.startedAt || new Date().toISOString(),
      lastUpdated: Date.now(),
    })
  }

  const pauseTimer = () => {
    setTimerState({
      ...timerState,
      isActive: false,
      activeSide: null,
    })
  }

  const switchSide = () => {
    if (!timerState.activeSide) return
    const newSide = timerState.activeSide === 'left' ? 'right' : 'left'
    setTimerState({
      ...timerState,
      activeSide: newSide,
      lastUpdated: Date.now(),
    })
  }

  const saveFeeding = async () => {
    if (!activeBaby || !user) {
      toast.error('Please select a baby first')
      return
    }

    if (timerState.leftDuration === 0 && timerState.rightDuration === 0) {
      toast.error('Timer has no duration')
      return
    }

    try {
      const breastSide: BreastSide =
        timerState.leftDuration > 0 && timerState.rightDuration > 0
          ? 'both'
          : timerState.leftDuration > 0
          ? 'left'
          : 'right'

      const { error } = await supabase.from('feeding_logs').insert({
        baby_id: activeBaby.id,
        user_id: user.id,
        feeding_type: 'breast',
        breast_side: breastSide,
        left_duration_minutes: Math.floor(timerState.leftDuration / 60),
        right_duration_minutes: Math.floor(timerState.rightDuration / 60),
        started_at: timerState.startedAt || new Date().toISOString(),
        ended_at: new Date().toISOString(),
      })

      if (error) throw error

      toast.success('Nursing session saved!')

      // Reset timer
      setTimerState({
        isActive: false,
        activeSide: null,
        leftDuration: 0,
        rightDuration: 0,
        startedAt: null,
        lastUpdated: Date.now(),
      })
      localStorage.removeItem(STORAGE_KEY)

      onComplete?.()
    } catch (error: any) {
      toast.error(error instanceof Error ? error.message : String(error) || 'Failed to save nursing session')
    }
  }

  const resetTimer = () => {
    if (confirm('Are you sure you want to reset the timer? This will discard the current session.')) {
      setTimerState({
        isActive: false,
        activeSide: null,
        leftDuration: 0,
        rightDuration: 0,
        startedAt: null,
        lastUpdated: Date.now(),
      })
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const hasAnyDuration = timerState.leftDuration > 0 || timerState.rightDuration > 0

  return (
    <Card className="bg-gradient-to-br from-baby-pink to-baby-purple">
      <div className="text-center">
        <h3 className="text-2xl font-bold !text-black mb-6">Nursing Timer</h3>

        {/* Timer Display */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Left Breast */}
          <motion.div
            className={`p-6 rounded-2xl ${
              timerState.activeSide === 'left'
                ? 'bg-primary-500 text-white shadow-playful'
                : 'bg-white text-gray-800'
            }`}
            animate={timerState.activeSide === 'left' ? {
              scale: [1, 1.05, 1],
              boxShadow: [
                '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                '0 20px 25px -5px rgba(255, 107, 138, 0.3)',
                '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
              ]
            } : {}}
            transition={{
              duration: 1.5,
              repeat: timerState.activeSide === 'left' ? Infinity : 0,
              ease: "easeInOut"
            }}
          >
            <div className="text-sm font-semibold mb-2">LEFT</div>
            <div className="text-4xl font-bold mb-2">{formatTime(timerState.leftDuration)}</div>
            {!timerState.isActive && (
              <Button
                onClick={() => startSide('left')}
                size="sm"
                className={timerState.activeSide === 'left' ? '' : 'bg-primary-500'}
              >
                {hasAnyDuration ? 'Resume' : 'Start'} Left
              </Button>
            )}
          </motion.div>

          {/* Right Breast */}
          <motion.div
            className={`p-6 rounded-2xl ${
              timerState.activeSide === 'right'
                ? 'bg-accent-500 text-white shadow-playful'
                : 'bg-white text-gray-800'
            }`}
            animate={timerState.activeSide === 'right' ? {
              scale: [1, 1.05, 1],
              boxShadow: [
                '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                '0 20px 25px -5px rgba(0, 116, 255, 0.3)',
                '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
              ]
            } : {}}
            transition={{
              duration: 1.5,
              repeat: timerState.activeSide === 'right' ? Infinity : 0,
              ease: "easeInOut"
            }}
          >
            <div className="text-sm font-semibold mb-2">RIGHT</div>
            <div className="text-4xl font-bold mb-2">{formatTime(timerState.rightDuration)}</div>
            {!timerState.isActive && (
              <Button
                onClick={() => startSide('right')}
                size="sm"
                variant="secondary"
                className={timerState.activeSide === 'right' ? '' : 'bg-accent-500'}
              >
                {hasAnyDuration ? 'Resume' : 'Start'} Right
              </Button>
            )}
          </motion.div>
        </div>

        {/* Active Timer Controls */}
        {timerState.isActive && (
          <div className="flex gap-3 mb-4">
            <Button onClick={pauseTimer} variant="outline" className="flex-1">
              Pause
            </Button>
            <Button onClick={switchSide} variant="secondary" className="flex-1">
              Switch to {timerState.activeSide === 'left' ? 'Right' : 'Left'}
            </Button>
          </div>
        )}

        {/* Save/Reset Controls */}
        {hasAnyDuration && !timerState.isActive && (
          <div className="flex gap-3">
            <Button onClick={saveFeeding} className="flex-1" size="lg">
              Save Session
            </Button>
            <Button onClick={resetTimer} variant="outline" size="lg">
              Reset
            </Button>
          </div>
        )}

        {!hasAnyDuration && (
          <p className="text-sm text-gray-600">
            Tap LEFT or RIGHT to start nursing timer
          </p>
        )}
      </div>
    </Card>
  )
}
