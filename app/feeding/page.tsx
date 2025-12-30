'use client'

import { useState, useMemo } from 'react'
import { useActiveBaby } from '@/lib/hooks/useActiveBaby'
import { useFeedings } from '@/lib/hooks/useFeedings'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PageTransition } from '@/components/ui/PageTransition'
import { DateFilter, DateRange } from '@/components/ui/DateFilter'
import { NursingTimer } from '@/components/feeding/NursingTimer'
import { BottleFeedingForm } from '@/components/feeding/BottleFeedingForm'
import { FeedingCard } from '@/components/feeding/FeedingCard'
import { FeedingLog } from '@/lib/types/feeding'
import { format, isToday, isYesterday, parseISO, isWithinInterval } from 'date-fns'
import Link from 'next/link'

type FeedingMode = 'schedule' | 'nursing' | 'bottle'

interface GroupedFeedings {
  date: string
  displayDate: string
  feedings: FeedingLog[]
  stats: {
    totalFeedings: number
    bottleCount: number
    nursingCount: number
    totalBottleMl: number
    totalNursingMinutes: number
  }
}

export default function FeedingPage() {
  const { activeBaby } = useActiveBaby()
  const { feedings, loading, refreshFeedings } = useFeedings(activeBaby?.id || null)
  const [mode, setMode] = useState<FeedingMode>('schedule')
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(2000, 0, 1),
    end: new Date(),
    label: 'All Time',
  })

  const handleComplete = () => {
    refreshFeedings()
    setMode('schedule')
  }

  const handleDateFilterChange = (range: DateRange) => {
    setDateRange(range)
  }

  // Prepare filtered feedings
  const filteredFeedings = useMemo(() => {
    return feedings.filter((feeding) => {
      const feedingDate = parseISO(feeding.started_at)
      return isWithinInterval(feedingDate, { start: dateRange.start, end: dateRange.end })
    })
  }, [feedings, dateRange])

  // Group feedings by date
  const groupedFeedings = useMemo(() => {
    const groups: { [key: string]: GroupedFeedings } = {}

    filteredFeedings.forEach((feeding) => {
      const date = format(parseISO(feeding.started_at), 'yyyy-MM-dd')

      if (!groups[date]) {
        const parsedDate = parseISO(feeding.started_at)
        let displayDate = format(parsedDate, 'EEEE, MMMM d, yyyy')

        if (isToday(parsedDate)) {
          displayDate = 'Today - ' + format(parsedDate, 'MMMM d, yyyy')
        } else if (isYesterday(parsedDate)) {
          displayDate = 'Yesterday - ' + format(parsedDate, 'MMMM d, yyyy')
        }

        groups[date] = {
          date,
          displayDate,
          feedings: [],
          stats: {
            totalFeedings: 0,
            bottleCount: 0,
            nursingCount: 0,
            totalBottleMl: 0,
            totalNursingMinutes: 0,
          },
        }
      }

      groups[date].feedings.push(feeding)
      groups[date].stats.totalFeedings++

      if (feeding.feeding_type === 'bottle') {
        groups[date].stats.bottleCount++
        groups[date].stats.totalBottleMl += feeding.amount_ml || 0
      } else {
        groups[date].stats.nursingCount++
        groups[date].stats.totalNursingMinutes +=
          (feeding.left_duration_minutes || 0) + (feeding.right_duration_minutes || 0)
      }
    })

    return Object.values(groups).sort((a, b) => b.date.localeCompare(a.date))
  }, [filteredFeedings])

  if (!activeBaby) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-baby-pink via-baby-blue to-baby-yellow p-4 md:p-8 flex items-center justify-center">
        <Card className="max-w-md">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👶</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">No Baby Selected</h2>
            <p className="text-gray-600 mb-6">Please add a baby first to start tracking feedings</p>
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
              Feeding for <span className="font-semibold text-primary-600">{activeBaby.name}</span>
            </p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline">← Back to Dashboard</Button>
          </Link>
        </div>

        {/* Mode Selector - Big Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
              <p className="text-sm text-gray-600">View feeding history</p>
            </div>
          </button>

          <button
            onClick={() => setMode('nursing')}
            className={`rounded-3xl p-6 transition-all ${
              mode === 'nursing'
                ? 'bg-gradient-to-br from-baby-pink to-pink-200 shadow-lg scale-105'
                : 'bg-white hover:shadow-md hover:scale-102'
            }`}
          >
            <div className="text-center">
              <div className="text-5xl mb-3">🤱</div>
              <h3 className="text-xl font-bold text-gray-800 mb-1">Nursing</h3>
              <p className="text-sm text-gray-600">Track breastfeeding</p>
            </div>
          </button>

          <button
            onClick={() => setMode('bottle')}
            className={`rounded-3xl p-6 transition-all ${
              mode === 'bottle'
                ? 'bg-gradient-to-br from-baby-blue to-blue-200 shadow-lg scale-105'
                : 'bg-white hover:shadow-md hover:scale-102'
            }`}
          >
            <div className="text-center">
              <div className="text-5xl mb-3">🍼</div>
              <h3 className="text-xl font-bold text-gray-800 mb-1">Bottle</h3>
              <p className="text-sm text-gray-600">Log bottle feeding</p>
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
        {mode === 'nursing' && <NursingTimer onComplete={handleComplete} />}

        {mode === 'bottle' && <BottleFeedingForm onComplete={handleComplete} />}

        {mode === 'schedule' && (
          <>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
              </div>
            ) : feedings.length === 0 ? (
              <Card>
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🍼</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">No feedings yet</h3>
                  <p className="text-gray-600 mb-6">Start tracking by logging a feeding!</p>
                  <div className="flex gap-3 justify-center">
                    <Button onClick={() => setMode('nursing')}>🤱 Nursing</Button>
                    <Button onClick={() => setMode('bottle')} variant="secondary">
                      🍼 Bottle
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <div className="space-y-6">
                {groupedFeedings.map((group) => (
                  <div key={group.date}>
                    {/* Date Header with Daily Stats */}
                    <div className="bg-white rounded-3xl shadow-soft p-4 mb-4">
                      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                        <div>
                          <h2 className="text-xl font-bold text-gray-800">{group.displayDate}</h2>
                          <p className="text-sm text-gray-600">
                            {group.stats.totalFeedings} feeding{group.stats.totalFeedings !== 1 ? 's' : ''}
                          </p>
                        </div>

                        {/* Daily Summary Stats */}
                        <div className="flex gap-2">
                          {group.stats.nursingCount > 0 && (
                            <div className="bg-baby-pink rounded-xl px-3 py-2 text-center">
                              <div className="text-xs text-gray-600">Nursing</div>
                              <div className="text-sm font-semibold text-primary-600">
                                {group.stats.nursingCount}x · {group.stats.totalNursingMinutes}m
                              </div>
                            </div>
                          )}
                          {group.stats.bottleCount > 0 && (
                            <div className="bg-baby-blue rounded-xl px-3 py-2 text-center">
                              <div className="text-xs text-gray-600">Bottle</div>
                              <div className="text-sm font-semibold text-accent-600">
                                {group.stats.bottleCount}x · {group.stats.totalBottleMl}ml
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Feedings Timeline */}
                    <div className="space-y-3 ml-4">
                      {group.feedings.map((feeding) => (
                        <div key={feeding.id} className="relative pl-6">
                          {/* Timeline dot */}
                          <div className="absolute left-0 top-3 w-3 h-3 rounded-full bg-primary-500" />
                          <div className="absolute left-1.5 top-6 bottom-0 w-0.5 bg-gray-200" />
                          <FeedingCard feeding={feeding} />
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
