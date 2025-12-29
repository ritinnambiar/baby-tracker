'use client'

import { useState } from 'react'
import { useActiveBaby } from '@/lib/hooks/useActiveBaby'
import { useGrowth } from '@/lib/hooks/useGrowth'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PageTransition } from '@/components/ui/PageTransition'
import { DateFilter, DateRange } from '@/components/ui/DateFilter'
import { GrowthForm } from '@/components/growth/GrowthForm'
import { GrowthCard } from '@/components/growth/GrowthCard'
import { GrowthChart } from '@/components/growth/GrowthChart'
import Link from 'next/link'
import { format, isWithinInterval, parseISO } from 'date-fns'

type GrowthMode = 'charts' | 'history' | 'log'

export default function GrowthPage() {
  const { activeBaby } = useActiveBaby()
  const { measurements, loading, refreshMeasurements } = useGrowth(activeBaby?.id || null)
  const [mode, setMode] = useState<GrowthMode>('charts')
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(2000, 0, 1),
    end: new Date(),
    label: 'All Time',
  })

  const handleComplete = () => {
    refreshMeasurements()
    setMode('charts')
  }

  const handleDateFilterChange = (range: DateRange) => {
    setDateRange(range)
  }

  // Filter measurements by date range
  const filteredMeasurements = useMemo(() => {
    return measurements.filter((measurement) => {
      const measurementDate = parseISO(measurement.measured_at)
      return isWithinInterval(measurementDate, { start: dateRange.start, end: dateRange.end })
    })
  }, [measurements, dateRange])

  if (!activeBaby) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-baby-pink via-baby-blue to-baby-yellow p-4 md:p-8 page-content-mobile flex items-center justify-center">
        <Card className="max-w-md">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👶</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">No Baby Selected</h2>
            <p className="text-gray-600 mb-6">Please add a baby first to start tracking growth</p>
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
              Growth for <span className="font-semibold text-primary-600">{activeBaby.name}</span>
            </p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline">← Back to Dashboard</Button>
          </Link>
        </div>

        {/* Mode Selector */}
        <div className="flex gap-3 mb-6">
          <Button
            variant={mode === 'charts' ? 'primary' : 'outline'}
            onClick={() => setMode('charts')}
            className="flex-1"
          >
            📈 Charts
          </Button>
          <Button
            variant={mode === 'history' ? 'primary' : 'outline'}
            onClick={() => setMode('history')}
            className="flex-1"
          >
            📋 History
          </Button>
          <Button
            variant={mode === 'log' ? 'primary' : 'outline'}
            onClick={() => setMode('log')}
            className="flex-1"
          >
            ✏️ Log
          </Button>
        </div>

        {/* Date Filter - show in charts and history mode */}
        {(mode === 'charts' || mode === 'history') && (
          <div className="mb-6">
            <DateFilter onFilterChange={handleDateFilterChange} initialFilter="all" />
          </div>
        )}

        {/* Content based on mode */}
        {mode === 'log' && <GrowthForm onComplete={handleComplete} />}

        {mode === 'charts' && (
          <>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
              </div>
            ) : measurements.length === 0 ? (
              <Card>
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📊</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">No measurements yet</h3>
                  <p className="text-gray-600 mb-6">Start tracking growth by logging measurements!</p>
                  <Button onClick={() => setMode('log')}>✏️ Log Measurement</Button>
                </div>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Weight Chart */}
                <GrowthChart measurements={filteredMeasurements} type="weight" />

                {/* Height Chart */}
                <GrowthChart measurements={filteredMeasurements} type="height" />

                {/* Head Circumference Chart */}
                <GrowthChart measurements={filteredMeasurements} type="head" />
              </div>
            )}
          </>
        )}

        {mode === 'history' && (
          <>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
              </div>
            ) : measurements.length === 0 ? (
              <Card>
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📊</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">No measurements yet</h3>
                  <p className="text-gray-600 mb-6">Start tracking growth by logging measurements!</p>
                  <Button onClick={() => setMode('log')}>✏️ Log Measurement</Button>
                </div>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredMeasurements.map((measurement) => (
                  <GrowthCard key={measurement.id} measurement={measurement} />
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
