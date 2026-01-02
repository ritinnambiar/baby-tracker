'use client'

import { useState, useMemo } from 'react'
import { useActiveBaby } from '@/lib/hooks/useActiveBaby'
import { useTheme } from '@/lib/hooks/useTheme'
import { useDiapers } from '@/lib/hooks/useDiapers'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PageTransition } from '@/components/ui/PageTransition'
import { DiaperForm } from '@/components/diaper/DiaperForm'
import { DiaperCard } from '@/components/diaper/DiaperCard'
import { DiaperChange } from '@/lib/types/diaper'
import { format, isToday, isYesterday, parseISO } from 'date-fns'
import Link from 'next/link'
import { TimelineCalendar } from '@/components/ui/TimelineCalendar'

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
  const { currentTheme } = useTheme()
  const { diapers, loading, refreshDiapers } = useDiapers(activeBaby?.id || null)
  const [mode, setMode] = useState<DiaperMode>('schedule')

  const handleComplete = () => {
    refreshDiapers()
    setMode('schedule')
  }

  // Group diapers by date
  const groupedDiapers = useMemo(() => {
    const groups: { [key: string]: GroupedDiapers } = {}

    diapers.forEach((diaper) => {
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
  }, [diapers])

  // Convert diapers to timeline events
  const timelineEvents = useMemo(() => {
    return diapers.map(diaper => {
      let type = ''
      let color = ''
      let icon = ''

      if (diaper.is_wet && diaper.is_dirty) {
        type = 'Both'
        color = 'bg-baby-yellow'
        icon = '💧💩'
      } else if (diaper.is_wet) {
        type = 'Wet'
        color = 'bg-baby-blue'
        icon = '💧'
      } else if (diaper.is_dirty) {
        type = 'Dirty'
        color = 'bg-baby-peach'
        icon = '💩'
      }

      return {
        id: diaper.id,
        startTime: diaper.changed_at,
        endTime: undefined, // Instant event
        title: type,
        subtitle: `Diaper Change - ${type}`,
        color,
        icon,
        photoUrl: diaper.photo_url,
      }
    })
  }, [diapers])

  if (!activeBaby) {
    return (
      <div className="min-h-screen p-4 md:p-8 page-content-mobile flex items-center justify-center" style={{ background: currentTheme.gradientCSS }}>
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
              Diapers for <span className="text-primary-600 font-bold">{activeBaby.name}</span>
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
                ? 'bg-gradient-to-br from-baby-yellow to-yellow-200 shadow-lg scale-105'
                : 'bg-white hover:shadow-md hover:scale-102'
            }`}
          >
            <div className="text-center">
              <div className="text-5xl mb-3">📅</div>
              <h3 className={`text-xl font-bold mb-1 ${mode === 'schedule' ? '!text-black' : 'text-gray-800'}`}>Schedule</h3>
              <p className={`text-sm ${mode === 'schedule' ? '!text-black' : 'text-gray-600'}`}>View diaper history</p>
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
              <h3 className={`text-xl font-bold mb-1 ${mode === 'log' ? '!text-black' : 'text-gray-800'}`}>Log Change</h3>
              <p className={`text-sm ${mode === 'log' ? '!text-black' : 'text-gray-600'}`}>Record diaper change</p>
            </div>
          </button>
        </div>

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
                        {diapers.length}
                      </div>
                      <div className="text-sm text-gray-600">Total Changes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">
                        {diapers.filter(d => d.is_wet && !d.is_dirty).length}
                      </div>
                      <div className="text-sm text-gray-600">💧 Wet</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-orange-600">
                        {diapers.filter(d => !d.is_wet && d.is_dirty).length}
                      </div>
                      <div className="text-sm text-gray-600">💩 Dirty</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary-500">
                        {diapers.filter(d => d.is_wet && d.is_dirty).length}
                      </div>
                      <div className="text-sm text-gray-600">💧💩 Both</div>
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
