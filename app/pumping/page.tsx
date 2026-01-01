'use client'

import { useState, useMemo } from 'react'
import { useActiveBaby } from '@/lib/hooks/useActiveBaby'
import { useTheme } from '@/lib/hooks/useTheme'
import { usePumping } from '@/lib/hooks/usePumping'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PageTransition } from '@/components/ui/PageTransition'
import { PumpingForm } from '@/components/pumping/PumpingForm'
import { PumpingCard } from '@/components/pumping/PumpingCard'
import { PumpingLog } from '@/lib/types/pumping'
import { format, isToday, isYesterday, parseISO } from 'date-fns'
import Link from 'next/link'
import { TimelineCalendar } from '@/components/ui/TimelineCalendar'

type PumpingMode = 'schedule' | 'log'

interface GroupedPumping {
  date: string
  displayDate: string
  sessions: PumpingLog[]
  stats: {
    totalSessions: number
    totalAmount: number
    leftAmount: number
    rightAmount: number
  }
}

export default function PumpingPage() {
  const { activeBaby } = useActiveBaby()
  const { currentTheme } = useTheme()
  const { pumpingSessions, loading, refreshPumpingSessions } = usePumping(activeBaby?.id || null)
  const [mode, setMode] = useState<PumpingMode>('schedule')

  const handleComplete = () => {
    refreshPumpingSessions()
    setMode('schedule')
  }

  // Group pumping sessions by date
  const groupedPumping = useMemo(() => {
    const groups: { [key: string]: GroupedPumping } = {}

    pumpingSessions.forEach((session) => {
      const date = format(parseISO(session.started_at), 'yyyy-MM-dd')

      if (!groups[date]) {
        const parsedDate = parseISO(session.started_at)
        let displayDate = format(parsedDate, 'EEEE, MMMM d, yyyy')

        if (isToday(parsedDate)) {
          displayDate = 'Today - ' + format(parsedDate, 'MMMM d, yyyy')
        } else if (isYesterday(parsedDate)) {
          displayDate = 'Yesterday - ' + format(parsedDate, 'MMMM d, yyyy')
        }

        groups[date] = {
          date,
          displayDate,
          sessions: [],
          stats: {
            totalSessions: 0,
            totalAmount: 0,
            leftAmount: 0,
            rightAmount: 0,
          },
        }
      }

      groups[date].sessions.push(session)
      groups[date].stats.totalSessions++
      groups[date].stats.totalAmount += session.total_amount_ml || 0
      groups[date].stats.leftAmount += session.left_amount_ml || 0
      groups[date].stats.rightAmount += session.right_amount_ml || 0
    })

    return Object.values(groups).sort((a, b) => b.date.localeCompare(a.date))
  }, [pumpingSessions])

  // Convert pumping sessions to timeline events
  const timelineEvents = useMemo(() => {
    return pumpingSessions.map(session => {
      const totalAmount = session.total_amount_ml || 0

      return {
        id: session.id,
        startTime: session.started_at,
        endTime: session.ended_at || undefined,
        title: `${totalAmount}ml`,
        subtitle: `Pumping - ${totalAmount}ml total`,
        color: 'bg-baby-purple',
        icon: '💧',
      }
    })
  }, [pumpingSessions])

  if (!activeBaby) {
    return (
      <div className="min-h-screen p-4 md:p-8 page-content-mobile flex items-center justify-center" style={{ background: currentTheme.gradientCSS }}>
        <Card className="max-w-md">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👶</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">No Baby Selected</h2>
            <p className="text-gray-600 mb-6">Please add a baby first to start tracking pumping</p>
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
              Pumping for <span className="text-primary-600 font-bold">{activeBaby.name}</span>
            </p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline" className="border-primary-500 text-primary-600 hover:bg-primary-50 font-semibold">← Back to Dashboard</Button>
          </Link>
        </div>

        {/* Mode Selector - Big Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => setMode('schedule')}
            className={`rounded-3xl p-6 transition-all ${
              mode === 'schedule'
                ? 'bg-gradient-to-br from-baby-purple to-purple-200 shadow-lg scale-105'
                : 'bg-white hover:shadow-md hover:scale-102'
            }`}
          >
            <div className="text-center">
              <div className="text-5xl mb-3">📅</div>
              <h3 className="text-xl font-bold text-gray-800 mb-1">Schedule</h3>
              <p className="text-sm text-gray-600">View pumping history</p>
            </div>
          </button>

          <button
            onClick={() => setMode('log')}
            className={`rounded-3xl p-6 transition-all ${
              mode === 'log'
                ? 'bg-gradient-to-br from-baby-pink to-pink-200 shadow-lg scale-105'
                : 'bg-white hover:shadow-md hover:scale-102'
            }`}
          >
            <div className="text-center">
              <div className="text-5xl mb-3">💧</div>
              <h3 className="text-xl font-bold text-gray-800 mb-1">Log Session</h3>
              <p className="text-sm text-gray-600">Record pumping</p>
            </div>
          </button>
        </div>

        {/* Content based on mode */}
        {mode === 'log' && <PumpingForm onComplete={handleComplete} />}

        {mode === 'schedule' && (
          <>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
              </div>
            ) : pumpingSessions.length === 0 ? (
              <Card>
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🍼</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">No pumping sessions yet</h3>
                  <p className="text-gray-600 mb-6">Start tracking by logging a pumping session!</p>
                  <Button onClick={() => setMode('log')}>✏️ Log Session</Button>
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
                        {pumpingSessions.length}
                      </div>
                      <div className="text-sm text-gray-600">Total Sessions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600">
                        {pumpingSessions.reduce((sum, s) => sum + (s.total_amount_ml || 0), 0)}ml
                      </div>
                      <div className="text-sm text-gray-600">💧 Total Volume</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-pink-600">
                        {pumpingSessions.reduce((sum, s) => sum + (s.left_amount_ml || 0), 0)}ml
                      </div>
                      <div className="text-sm text-gray-600">Left Breast</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">
                        {pumpingSessions.reduce((sum, s) => sum + (s.right_amount_ml || 0), 0)}ml
                      </div>
                      <div className="text-sm text-gray-600">Right Breast</div>
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
