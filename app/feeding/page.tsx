'use client'

import { useState, useMemo } from 'react'
import { useActiveBaby } from '@/lib/hooks/useActiveBaby'
import { useTheme } from '@/lib/hooks/useTheme'
import { useFeedings } from '@/lib/hooks/useFeedings'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PageTransition } from '@/components/ui/PageTransition'
import { NursingTimer } from '@/components/feeding/NursingTimer'
import { BottleFeedingForm } from '@/components/feeding/BottleFeedingForm'
import { FeedingCard } from '@/components/feeding/FeedingCard'
import { FeedingLog } from '@/lib/types/feeding'
import { format, isToday, isYesterday, parseISO } from 'date-fns'
import Link from 'next/link'
import { TimelineCalendar } from '@/components/ui/TimelineCalendar'

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
  const { currentTheme } = useTheme()
  const { feedings, loading, refreshFeedings } = useFeedings(activeBaby?.id || null)
  const [mode, setMode] = useState<FeedingMode>('schedule')

  const handleComplete = () => {
    refreshFeedings()
    setMode('schedule')
  }

  // Group feedings by date
  const groupedFeedings = useMemo(() => {
    const groups: { [key: string]: GroupedFeedings } = {}

    feedings.forEach((feeding) => {
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
  }, [feedings])

  // Convert feedings to timeline events
  const timelineEvents = useMemo(() => {
    return feedings.map(feeding => {
      const isBottle = feeding.feeding_type === 'bottle'
      const duration = isBottle
        ? 0
        : (feeding.left_duration_minutes || 0) + (feeding.right_duration_minutes || 0)

      return {
        id: feeding.id,
        startTime: feeding.started_at,
        endTime: duration > 0 ? (feeding.ended_at ?? undefined) : undefined,
        title: isBottle
          ? `${feeding.amount_ml}ml`
          : `${duration}m`,
        subtitle: isBottle
          ? `Bottle - ${feeding.amount_ml}ml`
          : `Nursing - ${feeding.breast_side}`,
        color: isBottle ? 'bg-baby-blue' : 'bg-baby-pink',
        icon: isBottle ? '🍼' : '🤱',
        photoUrl: feeding.photo_url,
      }
    })
  }, [feedings])

  if (!activeBaby) {
    return (
      <div className="min-h-screen p-4 md:p-8 flex items-center justify-center" style={{ background: currentTheme.gradientCSS }}>
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
              Feeding for <span className="text-primary-600 font-bold">{activeBaby.name}</span>
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
                ? 'bg-gradient-to-br from-baby-yellow to-yellow-200 shadow-lg scale-105'
                : 'bg-white hover:shadow-md hover:scale-102'
            }`}
          >
            <div className="text-center">
              <div className="text-5xl mb-3">📅</div>
              <h3 className={`text-xl font-bold mb-1 ${mode === 'schedule' ? '!text-black' : 'text-gray-800'}`}>Schedule</h3>
              <p className={`text-sm ${mode === 'schedule' ? '!text-black' : 'text-gray-600'}`}>View feeding history</p>
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
              <h3 className={`text-xl font-bold mb-1 ${mode === 'nursing' ? '!text-black' : 'text-gray-800'}`}>Nursing</h3>
              <p className={`text-sm ${mode === 'nursing' ? '!text-black' : 'text-gray-600'}`}>Track breastfeeding</p>
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
              <h3 className={`text-xl font-bold mb-1 ${mode === 'bottle' ? '!text-black' : 'text-gray-800'}`}>Bottle</h3>
              <p className={`text-sm ${mode === 'bottle' ? '!text-black' : 'text-gray-600'}`}>Log bottle feeding</p>
            </div>
          </button>
        </div>

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
                        {feedings.length}
                      </div>
                      <div className="text-sm text-gray-600">Total Feedings</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-pink-600">
                        {feedings.filter(f => f.feeding_type === 'breast').length}
                      </div>
                      <div className="text-sm text-gray-600">🤱 Nursing</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">
                        {feedings.filter(f => f.feeding_type === 'bottle').length}
                      </div>
                      <div className="text-sm text-gray-600">🍼 Bottle</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-accent-600">
                        {feedings.filter(f => f.feeding_type === 'bottle').reduce((sum, f) => sum + (f.amount_ml || 0), 0)}ml
                      </div>
                      <div className="text-sm text-gray-600">Total Volume</div>
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
                      // Find the feeding by ID and you could show a modal or expanded view
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
