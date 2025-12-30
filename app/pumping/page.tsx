'use client'

import { useState, useMemo } from 'react'
import { useActiveBaby } from '@/lib/hooks/useActiveBaby'
import { usePumping } from '@/lib/hooks/usePumping'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PageTransition } from '@/components/ui/PageTransition'
import { DateFilter, DateRange } from '@/components/ui/DateFilter'
import { PumpingForm } from '@/components/pumping/PumpingForm'
import { PumpingCard } from '@/components/pumping/PumpingCard'
import { PumpingLog } from '@/lib/types/pumping'
import { format, isToday, isYesterday, parseISO, isWithinInterval } from 'date-fns'
import Link from 'next/link'

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
  const { pumpingSessions, loading, refreshPumpingSessions } = usePumping(activeBaby?.id || null)
  const [mode, setMode] = useState<PumpingMode>('schedule')
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(2000, 0, 1),
    end: new Date(),
    label: 'All Time',
  })

  const handleComplete = () => {
    refreshPumpingSessions()
    setMode('schedule')
  }

  const handleDateFilterChange = (range: DateRange) => {
    setDateRange(range)
  }

  // Prepare filtered sessions
  const filteredSessions = useMemo(() => {
    return pumpingSessions.filter((session) => {
      const sessionDate = parseISO(session.started_at)
      return isWithinInterval(sessionDate, { start: dateRange.start, end: dateRange.end })
    })
  }, [pumpingSessions, dateRange])

  // Group pumping sessions by date
  const groupedPumping = useMemo(() => {
    const groups: { [key: string]: GroupedPumping } = {}

    filteredSessions.forEach((session) => {
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
  }, [filteredSessions])

  if (!activeBaby) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-baby-pink via-baby-blue to-baby-yellow p-4 md:p-8 page-content-mobile flex items-center justify-center">
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
      <div className="min-h-screen bg-gradient-to-br from-baby-pink via-baby-blue to-baby-yellow p-4 md:p-8 page-content-mobile">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
          <div>
            <Link href="/dashboard" className="inline-block">
              <h1 className="text-4xl font-bold text-primary-500 mb-2 hover:text-primary-600 transition-colors cursor-pointer">
                Baby Tracker 👶
              </h1>
            </Link>
            <p className="text-gray-600">
              Pumping for <span className="font-semibold text-primary-600">{activeBaby.name}</span>
            </p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline">← Back to Dashboard</Button>
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

        {/* Date Filter - only show in schedule mode */}
        {mode === 'schedule' && (
          <div className="mb-6">
            <DateFilter onFilterChange={handleDateFilterChange} initialFilter="all" />
          </div>
        )}

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
              <div className="space-y-6">
                {groupedPumping.map((group) => (
                  <div key={group.date}>
                    {/* Date Header with Daily Stats */}
                    <div className="bg-white rounded-3xl shadow-soft p-4 mb-4">
                      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                        <div>
                          <h2 className="text-xl font-bold text-gray-800">{group.displayDate}</h2>
                          <p className="text-sm text-gray-600">
                            {group.stats.totalSessions} session{group.stats.totalSessions !== 1 ? 's' : ''}
                          </p>
                        </div>

                        {/* Daily Summary Stats */}
                        <div className="flex gap-2">
                          <div className="bg-baby-purple rounded-xl px-3 py-2 text-center">
                            <div className="text-xs text-gray-600">Total</div>
                            <div className="text-sm font-semibold text-primary-600">
                              💧 {group.stats.totalAmount}ml
                            </div>
                          </div>
                          {group.stats.leftAmount > 0 && (
                            <div className="bg-baby-pink rounded-xl px-3 py-2 text-center">
                              <div className="text-xs text-gray-600">Left</div>
                              <div className="text-sm font-semibold text-primary-600">
                                {group.stats.leftAmount}ml
                              </div>
                            </div>
                          )}
                          {group.stats.rightAmount > 0 && (
                            <div className="bg-baby-blue rounded-xl px-3 py-2 text-center">
                              <div className="text-xs text-gray-600">Right</div>
                              <div className="text-sm font-semibold text-accent-600">
                                {group.stats.rightAmount}ml
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Pumping Timeline */}
                    <div className="space-y-3 ml-4">
                      {group.sessions.map((session) => (
                        <div key={session.id} className="relative pl-6">
                          {/* Timeline dot */}
                          <div className="absolute left-0 top-3 w-3 h-3 rounded-full bg-primary-500" />
                          <div className="absolute left-1.5 top-6 bottom-0 w-0.5 bg-gray-200" />
                          <PumpingCard pumping={session} />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        </div>
      </div>
    </PageTransition>
  )
}
