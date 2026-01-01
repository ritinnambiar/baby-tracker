'use client'

import { useState, useMemo } from 'react'
import { useActiveBaby } from '@/lib/hooks/useActiveBaby'
import { useTheme } from '@/lib/hooks/useTheme'
import { useSleep } from '@/lib/hooks/useSleep'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PageTransition } from '@/components/ui/PageTransition'
import { SleepTimer } from '@/components/sleep/SleepTimer'
import { SleepForm } from '@/components/sleep/SleepForm'
import { SleepCard } from '@/components/sleep/SleepCard'
import { SleepLog } from '@/lib/types/sleep'
import { format, isToday, isYesterday, parseISO } from 'date-fns'
import Link from 'next/link'
import { TimelineCalendar } from '@/components/ui/TimelineCalendar'

type SleepMode = 'schedule' | 'timer' | 'manual'

interface GroupedSleeps {
  date: string
  displayDate: string
  sleeps: SleepLog[]
  stats: {
    totalSleeps: number
    napCount: number
    nightCount: number
    totalNapMinutes: number
    totalNightMinutes: number
  }
}

export default function SleepPage() {
  const { activeBaby } = useActiveBaby()
  const { currentTheme } = useTheme()
  const { sleeps, loading, refreshSleeps } = useSleep(activeBaby?.id || null)
  const [mode, setMode] = useState<SleepMode>('schedule')

  const handleComplete = () => {
    refreshSleeps()
    setMode('schedule')
  }

  // Group sleeps by date
  const groupedSleeps = useMemo(() => {
    const groups: { [key: string]: GroupedSleeps } = {}

    sleeps.forEach((sleep) => {
      const date = format(parseISO(sleep.started_at), 'yyyy-MM-dd')

      if (!groups[date]) {
        const parsedDate = parseISO(sleep.started_at)
        let displayDate = format(parsedDate, 'EEEE, MMMM d, yyyy')

        if (isToday(parsedDate)) {
          displayDate = 'Today - ' + format(parsedDate, 'MMMM d, yyyy')
        } else if (isYesterday(parsedDate)) {
          displayDate = 'Yesterday - ' + format(parsedDate, 'MMMM d, yyyy')
        }

        groups[date] = {
          date,
          displayDate,
          sleeps: [],
          stats: {
            totalSleeps: 0,
            napCount: 0,
            nightCount: 0,
            totalNapMinutes: 0,
            totalNightMinutes: 0,
          },
        }
      }

      groups[date].sleeps.push(sleep)
      groups[date].stats.totalSleeps++

      if (sleep.sleep_type === 'nap') {
        groups[date].stats.napCount++
        groups[date].stats.totalNapMinutes += sleep.duration_minutes || 0
      } else {
        groups[date].stats.nightCount++
        groups[date].stats.totalNightMinutes += sleep.duration_minutes || 0
      }
    })

    return Object.values(groups).sort((a, b) => b.date.localeCompare(a.date))
  }, [sleeps])

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (mins === 0) return `${hours}h`
    return `${hours}h ${mins}m`
  }

  // Convert sleeps to timeline events
  const timelineEvents = useMemo(() => {
    return sleeps.map(sleep => {
      const duration = sleep.duration_minutes || 0

      return {
        id: sleep.id,
        startTime: sleep.started_at,
        endTime: sleep.ended_at || undefined,
        title: duration > 0 ? formatDuration(duration) : 'Active',
        subtitle: `${sleep.sleep_type === 'nap' ? 'Nap' : 'Night Sleep'} - ${formatDuration(duration)}`,
        color: sleep.sleep_type === 'nap' ? 'bg-gray-800' : 'bg-gray-900',
        icon: sleep.sleep_type === 'nap' ? '😴' : '🌙',
      }
    })
  }, [sleeps])

  if (!activeBaby) {
    return (
      <div className="min-h-screen p-4 md:p-8 page-content-mobile flex items-center justify-center" style={{ background: currentTheme.gradientCSS }}>
        <Card className="max-w-md">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👶</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">No Baby Selected</h2>
            <p className="text-gray-600 mb-6">Please add a baby first to start tracking sleep</p>
            <Link href="/settings">
              <Button size="lg">Add Baby</Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <PageTransition>
      <div className="min-h-screen p-4 md:p-8 page-content-mobile" style={{ background: currentTheme.gradientCSS }}>
        <div className="max-w-4xl mx-auto">
          {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
          <div>
            <Link href="/dashboard" className="inline-block">
              <h1 className="text-4xl font-bold text-primary-600 mb-2 hover:text-primary-700 transition-colors cursor-pointer drop-shadow-md">
                Baby Tracker 👶
              </h1>
            </Link>
            <p className="text-gray-800 font-medium">
              Sleep for <span className="text-primary-600 font-bold">{activeBaby.name}</span>
            </p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline" className="border-primary-500 text-primary-600 hover:bg-primary-50 font-semibold">← Back to Dashboard</Button>
          </Link>
        </div>

        {/* Mode Selector - Big Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <button
            onClick={() => setMode('schedule')}
            className={`rounded-3xl p-6 transition-all ${
              mode === 'schedule'
                ? 'bg-gradient-to-br from-gray-800 to-gray-700 text-white shadow-lg scale-105'
                : 'bg-white hover:shadow-md hover:scale-102'
            }`}
          >
            <div className="text-center">
              <div className="text-5xl mb-3">📅</div>
              <h3 className={`text-xl font-bold mb-1 ${mode === 'schedule' ? 'text-white' : 'text-gray-800'}`}>Schedule</h3>
              <p className={`text-sm ${mode === 'schedule' ? 'text-gray-200' : 'text-gray-600'}`}>View sleep history</p>
            </div>
          </button>

          <button
            onClick={() => setMode('timer')}
            className={`rounded-3xl p-6 transition-all ${
              mode === 'timer'
                ? 'bg-gradient-to-br from-gray-900 to-gray-800 text-white shadow-lg scale-105'
                : 'bg-white hover:shadow-md hover:scale-102'
            }`}
          >
            <div className="text-center">
              <div className="text-5xl mb-3">⏱️</div>
              <h3 className={`text-xl font-bold mb-1 ${mode === 'timer' ? 'text-white' : 'text-gray-800'}`}>Timer</h3>
              <p className={`text-sm ${mode === 'timer' ? 'text-gray-200' : 'text-gray-600'}`}>Track active sleep</p>
            </div>
          </button>

          <button
            onClick={() => setMode('manual')}
            className={`rounded-3xl p-6 transition-all ${
              mode === 'manual'
                ? 'bg-gradient-to-br from-baby-yellow to-yellow-200 shadow-lg scale-105'
                : 'bg-white hover:shadow-md hover:scale-102'
            }`}
          >
            <div className="text-center">
              <div className="text-5xl mb-3">✏️</div>
              <h3 className="text-xl font-bold text-gray-800 mb-1">Manual</h3>
              <p className="text-sm text-gray-600">Log past sleep</p>
            </div>
          </button>
        </div>

        {/* Content based on mode */}
        {mode === 'timer' && <SleepTimer onComplete={handleComplete} />}

        {mode === 'manual' && <SleepForm onComplete={handleComplete} />}

        {mode === 'schedule' && (
          <>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
              </div>
            ) : sleeps.length === 0 ? (
              <Card>
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">😴</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">No sleep sessions yet</h3>
                  <p className="text-gray-600 mb-6">Start tracking by logging a sleep session!</p>
                  <div className="flex gap-3 justify-center">
                    <Button onClick={() => setMode('timer')}>⏱️ Timer</Button>
                    <Button onClick={() => setMode('manual')} variant="secondary">
                      ✏️ Manual Entry
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <div className="space-y-4">
                {/* Summary Stats */}
                <Card>
                  <div className="mb-3 text-center">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      📊 All Time Summary
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary-600">
                        {sleeps.length}
                      </div>
                      <div className="text-sm text-gray-600">Total Sessions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">
                        {sleeps.filter(s => s.sleep_type === 'nap').length}
                      </div>
                      <div className="text-sm text-gray-600">😴 Naps</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600">
                        {sleeps.filter(s => s.sleep_type === 'night').length}
                      </div>
                      <div className="text-sm text-gray-600">🌙 Night Sleep</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-accent-600">
                        {formatDuration(sleeps.reduce((sum, s) => sum + (s.duration_minutes || 0), 0))}
                      </div>
                      <div className="text-sm text-gray-600">Total Sleep</div>
                    </div>
                  </div>
                </Card>

                {/* Calendar Timeline */}
                <Card>
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">
                      📅 Calendar Timeline View
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Scroll horizontally to view different days. Click on any block to see full details.
                    </p>
                  </div>
                  <TimelineCalendar
                    events={timelineEvents}
                    dateRange={{ start: new Date(2000, 0, 1), end: new Date() }}
                    onEventClick={(event) => {
                      console.log('Clicked event:', event)
                    }}
                  />
                </Card>
              </div>
            )}
          </>
        )}
        </div>
      </div>
    </PageTransition>
  )
}
