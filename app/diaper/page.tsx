'use client'

import { useState, useMemo } from 'react'
import { useActiveBaby } from '@/lib/hooks/useActiveBaby'
import { useDiapers } from '@/lib/hooks/useDiapers'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PageTransition } from '@/components/ui/PageTransition'
import { DateFilter, DateRange } from '@/components/ui/DateFilter'
import { DiaperForm } from '@/components/diaper/DiaperForm'
import { DiaperCard } from '@/components/diaper/DiaperCard'
import { DiaperChange } from '@/lib/types/diaper'
import { format, isToday, isYesterday, parseISO, isWithinInterval } from 'date-fns'
import Link from 'next/link'

type DiaperMode = 'schedule' | 'log'

interface GroupedDiapers {
  date: string
  displayDate: string
  diapers: DiaperChange[]
  stats: {
    totalChanges: number
    wetCount: number
    dirtyCount: number
    bothCount: number
  }
}

export default function DiaperPage() {
  const { activeBaby } = useActiveBaby()
  const { diapers, loading, refreshDiapers } = useDiapers(activeBaby?.id || null)
  const [mode, setMode] = useState<DiaperMode>('schedule')
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(2000, 0, 1),
    end: new Date(),
    label: 'All Time',
  })

  const handleComplete = () => {
    refreshDiapers()
    setMode('schedule')
  }

  const handleDateFilterChange = (range: DateRange) => {
    setDateRange(range)
  }

  // Prepare filtered diapers
  const filteredDiapers = useMemo(() => {
    return diapers.filter((diaper) => {
      const diaperDate = parseISO(diaper.changed_at)
      return isWithinInterval(diaperDate, { start: dateRange.start, end: dateRange.end })
    })
  }, [diapers, dateRange])

  // Group diapers by date
  const groupedDiapers = useMemo(() => {
    const groups: { [key: string]: GroupedDiapers } = {}

    filteredDiapers.forEach((diaper) => {
      const date = format(parseISO(diaper.changed_at), 'yyyy-MM-dd')

      if (!groups[date]) {
        const parsedDate = parseISO(diaper.changed_at)
        let displayDate = format(parsedDate, 'EEEE, MMMM d, yyyy')

        if (isToday(parsedDate)) {
          displayDate = 'Today - ' + format(parsedDate, 'MMMM d, yyyy')
        } else if (isYesterday(parsedDate)) {
          displayDate = 'Yesterday - ' + format(parsedDate, 'MMMM d, yyyy')
        }

        groups[date] = {
          date,
          displayDate,
          diapers: [],
          stats: {
            totalChanges: 0,
            wetCount: 0,
            dirtyCount: 0,
            bothCount: 0,
          },
        }
      }

      groups[date].diapers.push(diaper)
      groups[date].stats.totalChanges++

      if (diaper.is_wet && diaper.is_dirty) {
        groups[date].stats.bothCount++
      } else if (diaper.is_wet) {
        groups[date].stats.wetCount++
      } else if (diaper.is_dirty) {
        groups[date].stats.dirtyCount++
      }
    })

    return Object.values(groups).sort((a, b) => b.date.localeCompare(a.date))
  }, [filteredDiapers])

  if (!activeBaby) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-baby-pink via-baby-blue to-baby-yellow p-4 md:p-8 page-content-mobile flex items-center justify-center">
        <Card className="max-w-md">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👶</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">No Baby Selected</h2>
            <p className="text-gray-600 mb-6">Please add a baby first to start tracking diapers</p>
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
              Diapers for <span className="font-semibold text-primary-600">{activeBaby.name}</span>
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
                ? 'bg-gradient-to-br from-baby-yellow to-yellow-200 shadow-lg scale-105'
                : 'bg-white hover:shadow-md hover:scale-102'
            }`}
          >
            <div className="text-center">
              <div className="text-5xl mb-3">📅</div>
              <h3 className="text-xl font-bold text-gray-800 mb-1">Schedule</h3>
              <p className="text-sm text-gray-600">View diaper history</p>
            </div>
          </button>

          <button
            onClick={() => setMode('log')}
            className={`rounded-3xl p-6 transition-all ${
              mode === 'log'
                ? 'bg-gradient-to-br from-baby-green to-green-200 shadow-lg scale-105'
                : 'bg-white hover:shadow-md hover:scale-102'
            }`}
          >
            <div className="text-center">
              <div className="text-5xl mb-3">✏️</div>
              <h3 className="text-xl font-bold text-gray-800 mb-1">Log Change</h3>
              <p className="text-sm text-gray-600">Record diaper change</p>
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
        {mode === 'log' && <DiaperForm onComplete={handleComplete} />}

        {mode === 'schedule' && (
          <>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
              </div>
            ) : diapers.length === 0 ? (
              <Card>
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🎯</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">No diaper changes yet</h3>
                  <p className="text-gray-600 mb-6">Start tracking by logging a diaper change!</p>
                  <Button onClick={() => setMode('log')}>✏️ Log Change</Button>
                </div>
              </Card>
            ) : (
              <div className="space-y-6">
                {groupedDiapers.map((group) => (
                  <div key={group.date}>
                    {/* Date Header with Daily Stats */}
                    <div className="bg-white rounded-3xl shadow-soft p-4 mb-4">
                      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                        <div>
                          <h2 className="text-xl font-bold text-gray-800">{group.displayDate}</h2>
                          <p className="text-sm text-gray-600">
                            {group.stats.totalChanges} change{group.stats.totalChanges !== 1 ? 's' : ''}
                          </p>
                        </div>

                        {/* Daily Summary Stats */}
                        <div className="flex gap-2">
                          {group.stats.wetCount > 0 && (
                            <div className="bg-baby-blue rounded-xl px-3 py-2 text-center">
                              <div className="text-xs text-gray-600">Wet</div>
                              <div className="text-sm font-semibold text-primary-600">
                                💧 {group.stats.wetCount}
                              </div>
                            </div>
                          )}
                          {group.stats.dirtyCount > 0 && (
                            <div className="bg-baby-peach rounded-xl px-3 py-2 text-center">
                              <div className="text-xs text-gray-600">Dirty</div>
                              <div className="text-sm font-semibold text-accent-600">
                                💩 {group.stats.dirtyCount}
                              </div>
                            </div>
                          )}
                          {group.stats.bothCount > 0 && (
                            <div className="bg-baby-yellow rounded-xl px-3 py-2 text-center">
                              <div className="text-xs text-gray-600">Both</div>
                              <div className="text-sm font-semibold text-gray-700">
                                💧💩 {group.stats.bothCount}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Diaper Timeline */}
                    <div className="space-y-3 ml-4">
                      {group.diapers.map((diaper) => (
                        <div key={diaper.id} className="relative pl-6">
                          {/* Timeline dot */}
                          <div className="absolute left-0 top-3 w-3 h-3 rounded-full bg-primary-500" />
                          <div className="absolute left-1.5 top-6 bottom-0 w-0.5 bg-gray-200" />
                          <DiaperCard diaper={diaper} />
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
