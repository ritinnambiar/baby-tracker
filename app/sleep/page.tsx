'use client'

import { useState, useMemo } from 'react'
import { useActiveBaby } from '@/lib/hooks/useActiveBaby'
import { useSleep } from '@/lib/hooks/useSleep'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PageTransition } from '@/components/ui/PageTransition'
import { DateFilter, DateRange } from '@/components/ui/DateFilter'
import { SleepTimer } from '@/components/sleep/SleepTimer'
import { SleepForm } from '@/components/sleep/SleepForm'
import { SleepCard } from '@/components/sleep/SleepCard'
import { SleepLog } from '@/lib/types/sleep'
import { format, isToday, isYesterday, parseISO, isWithinInterval } from 'date-fns'
import Link from 'next/link'

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
  const { sleeps, loading, refreshSleeps } = useSleep(activeBaby?.id || null)
  const [mode, setMode] = useState<SleepMode>('schedule')
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(2000, 0, 1),
    end: new Date(),
    label: 'All Time',
  })

  const handleComplete = () => {
    refreshSleeps()
    setMode('schedule')
  }

  const handleDateFilterChange = (range: DateRange) => {
    setDateRange(range)
  }

  // Prepare filtered sleeps
  const filteredSleeps = useMemo(() => {
    return sleeps.filter((sleep) => {
      const sleepDate = parseISO(sleep.started_at)
      return isWithinInterval(sleepDate, { start: dateRange.start, end: dateRange.end })
    })
  }, [sleeps, dateRange])

  // Group sleeps by date
  const groupedSleeps = useMemo(() => {
    const groups: { [key: string]: GroupedSleeps } = {}

    filteredSleeps.forEach((sleep) => {
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
  }, [filteredSleeps])

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (mins === 0) return `${hours}h`
    return `${hours}h ${mins}m`
  }

  if (!activeBaby) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-baby-pink via-baby-blue to-baby-yellow p-4 md:p-8 page-content-mobile flex items-center justify-center">
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
              Sleep for <span className="font-semibold text-primary-600">{activeBaby.name}</span>
            </p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline">← Back to Dashboard</Button>
          </Link>
        </div>

        {/* Mode Selector */}
        <div className="flex gap-3 mb-6">
          <Button
            variant={mode === 'schedule' ? 'primary' : 'outline'}
            onClick={() => setMode('schedule')}
            className="flex-1"
          >
            📅 Schedule
          </Button>
          <Button
            variant={mode === 'timer' ? 'primary' : 'outline'}
            onClick={() => setMode('timer')}
            className="flex-1"
          >
            ⏱️ Timer
          </Button>
          <Button
            variant={mode === 'manual' ? 'primary' : 'outline'}
            onClick={() => setMode('manual')}
            className="flex-1"
          >
            ✏️ Manual
          </Button>
        </div>

        {/* Date Filter - only show in schedule mode */}
        {mode === 'schedule' && (
          <div className="mb-6">
            <DateFilter onFilterChange={handleDateFilterChange} initialFilter="all" />
          </div>
        )}

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
              <div className="space-y-6">
                {groupedSleeps.map((group) => (
                  <div key={group.date}>
                    {/* Date Header with Daily Stats */}
                    <div className="bg-white rounded-3xl shadow-soft p-4 mb-4">
                      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                        <div>
                          <h2 className="text-xl font-bold text-gray-800">{group.displayDate}</h2>
                          <p className="text-sm text-gray-600">
                            {group.stats.totalSleeps} sleep session{group.stats.totalSleeps !== 1 ? 's' : ''}
                          </p>
                        </div>

                        {/* Daily Summary Stats */}
                        <div className="flex gap-2">
                          {group.stats.napCount > 0 && (
                            <div className="bg-baby-blue rounded-xl px-3 py-2 text-center">
                              <div className="text-xs text-gray-600">Naps</div>
                              <div className="text-sm font-semibold text-primary-600">
                                {group.stats.napCount}x · {formatDuration(group.stats.totalNapMinutes)}
                              </div>
                            </div>
                          )}
                          {group.stats.nightCount > 0 && (
                            <div className="bg-baby-purple rounded-xl px-3 py-2 text-center">
                              <div className="text-xs text-gray-600">Night</div>
                              <div className="text-sm font-semibold text-accent-600">
                                {group.stats.nightCount}x · {formatDuration(group.stats.totalNightMinutes)}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Sleep Timeline */}
                    <div className="space-y-3 ml-4">
                      {group.sleeps.map((sleep) => (
                        <div key={sleep.id} className="relative pl-6">
                          {/* Timeline dot */}
                          <div className="absolute left-0 top-3 w-3 h-3 rounded-full bg-primary-500" />
                          <div className="absolute left-1.5 top-6 bottom-0 w-0.5 bg-gray-200" />
                          <SleepCard sleep={sleep} />
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
