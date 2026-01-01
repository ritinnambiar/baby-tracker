'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { useActiveBaby } from '@/lib/hooks/useActiveBaby'
import { useTheme } from '@/lib/hooks/useTheme'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PageTransition } from '@/components/ui/PageTransition'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { DateFilter, DateRange } from '@/components/ui/DateFilter'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { startOfDay, endOfDay, isWithinInterval, parseISO, format, differenceInDays, eachDayOfInterval } from 'date-fns'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { FeedingLog } from '@/lib/types/feeding'
import { SleepLog } from '@/lib/types/sleep'
import { DiaperChange } from '@/lib/types/diaper'
import { PumpingLog } from '@/lib/types/pumping'

const COLORS = ['#FF6B8A', '#0074FF', '#FBBF24', '#10B981', '#8B5CF6']

export default function AnalyticsPage() {
  const { currentTheme } = useTheme()
  const { user, loading: authLoading } = useAuth()
  const { activeBaby, loading: babiesLoading } = useActiveBaby()
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(new Date().setDate(new Date().getDate() - 14)),
    end: new Date(),
    label: 'Last 14 Days',
  })

  const [data, setData] = useState<{
    feedings: FeedingLog[]
    sleeps: SleepLog[]
    diapers: DiaperChange[]
    pumpings: PumpingLog[]
  }>({
    feedings: [],
    sleeps: [],
    diapers: [],
    pumpings: [],
  })

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
  }, [user, router])

  useEffect(() => {
    const fetchData = async () => {
      if (!activeBaby) {
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const [feedingsRes, sleepsRes, diapersRes, pumpingsRes] = await Promise.all([
          supabase
            .from('feeding_logs')
            .select('*')
            .eq('baby_id', activeBaby.id)
            .gte('started_at', startOfDay(dateRange.start).toISOString())
            .lte('started_at', endOfDay(dateRange.end).toISOString())
            .order('started_at', { ascending: true }),
          supabase
            .from('sleep_logs')
            .select('*')
            .eq('baby_id', activeBaby.id)
            .gte('started_at', startOfDay(dateRange.start).toISOString())
            .lte('started_at', endOfDay(dateRange.end).toISOString())
            .order('started_at', { ascending: true }),
          supabase
            .from('diaper_changes')
            .select('*')
            .eq('baby_id', activeBaby.id)
            .gte('changed_at', startOfDay(dateRange.start).toISOString())
            .lte('changed_at', endOfDay(dateRange.end).toISOString())
            .order('changed_at', { ascending: true }),
          supabase
            .from('pumping_logs')
            .select('*')
            .eq('baby_id', activeBaby.id)
            .gte('started_at', startOfDay(dateRange.start).toISOString())
            .lte('started_at', endOfDay(dateRange.end).toISOString())
            .order('started_at', { ascending: true }),
        ])

        setData({
          feedings: feedingsRes.data || [],
          sleeps: sleepsRes.data || [],
          diapers: diapersRes.data || [],
          pumpings: pumpingsRes.data || [],
        })
      } catch (error) {
        console.error('Error fetching analytics data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [activeBaby, dateRange, supabase])

  // Prepare daily trend data
  const dailyTrends = React.useMemo(() => {
    const days = eachDayOfInterval({ start: dateRange.start, end: dateRange.end })

    return days.map((day) => {
      const dayStart = startOfDay(day)
      const dayEnd = endOfDay(day)

      const feedingsCount = data.feedings.filter((f) =>
        isWithinInterval(parseISO(f.started_at), { start: dayStart, end: dayEnd })
      ).length

      const sleepTotal = data.sleeps
        .filter(
          (s) =>
            s.ended_at &&
            isWithinInterval(parseISO(s.started_at), { start: dayStart, end: dayEnd })
        )
        .reduce((sum, s) => {
          const start = new Date(s.started_at)
          const end = new Date(s.ended_at!)
          return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60)
        }, 0)

      const diapersCount = data.diapers.filter((d) =>
        isWithinInterval(parseISO(d.changed_at), { start: dayStart, end: dayEnd })
      ).length

      return {
        date: format(day, 'MMM d'),
        feedings: feedingsCount,
        sleep: Math.round(sleepTotal * 10) / 10,
        diapers: diapersCount,
      }
    })
  }, [data, dateRange])

  // Feeding breakdown (bottle vs breast)
  const feedingBreakdown = React.useMemo(() => {
    const bottle = data.feedings.filter((f) => f.feeding_type === 'bottle').length
    const breast = data.feedings.filter((f) => f.feeding_type === 'breast').length
    return [
      { name: 'Bottle', value: bottle },
      { name: 'Breast', value: breast },
    ]
  }, [data.feedings])

  // Diaper breakdown (wet vs dirty)
  const diaperBreakdown = React.useMemo(() => {
    const wetOnly = data.diapers.filter((d) => d.is_wet && !d.is_dirty).length
    const dirtyOnly = data.diapers.filter((d) => !d.is_wet && d.is_dirty).length
    const both = data.diapers.filter((d) => d.is_wet && d.is_dirty).length
    return [
      { name: 'Wet Only', value: wetOnly },
      { name: 'Dirty Only', value: dirtyOnly },
      { name: 'Both', value: both },
    ]
  }, [data.diapers])

  // Sleep patterns (nap vs night)
  const sleepPatterns = React.useMemo(() => {
    const naps = data.sleeps.filter((s) => s.sleep_type === 'nap')
    const nights = data.sleeps.filter((s) => s.sleep_type === 'night')

    const napTotal = naps
      .filter((s) => s.ended_at)
      .reduce((sum, s) => {
        const start = new Date(s.started_at)
        const end = new Date(s.ended_at!)
        return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60)
      }, 0)

    const nightTotal = nights
      .filter((s) => s.ended_at)
      .reduce((sum, s) => {
        const start = new Date(s.started_at)
        const end = new Date(s.ended_at!)
        return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60)
      }, 0)

    return [
      { name: 'Naps', hours: Math.round(napTotal * 10) / 10, count: naps.length },
      { name: 'Night', hours: Math.round(nightTotal * 10) / 10, count: nights.length },
    ]
  }, [data.sleeps])

  // Calculate insights
  const insights = React.useMemo(() => {
    const avgFeedingsPerDay = data.feedings.length / Math.max(differenceInDays(dateRange.end, dateRange.start), 1)
    const avgSleepPerDay = sleepPatterns.reduce((sum, p) => sum + p.hours, 0) / Math.max(differenceInDays(dateRange.end, dateRange.start), 1)
    const avgDiapersPerDay = data.diapers.length / Math.max(differenceInDays(dateRange.end, dateRange.start), 1)

    const longestSleep = data.sleeps
      .filter((s) => s.ended_at)
      .map((s) => {
        const start = new Date(s.started_at)
        const end = new Date(s.ended_at!)
        return (end.getTime() - start.getTime()) / (1000 * 60)
      })
      .sort((a, b) => b - a)[0] || 0

    return {
      avgFeedingsPerDay: Math.round(avgFeedingsPerDay * 10) / 10,
      avgSleepPerDay: Math.round(avgSleepPerDay * 10) / 10,
      avgDiapersPerDay: Math.round(avgDiapersPerDay * 10) / 10,
      longestSleepHours: Math.floor(longestSleep / 60),
      longestSleepMins: Math.round(longestSleep % 60),
    }
  }, [data, dateRange, sleepPatterns])

  if (authLoading || babiesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: currentTheme.gradientCSS }}>
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <PageTransition>
      <div className="min-h-screen p-4 md:p-8 page-content-mobile" style={{ background: currentTheme.gradientCSS }}>
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <Link
              href="/dashboard"
              className="text-primary-500 dark:text-yellow-400 hover:underline text-sm mb-2 inline-block font-semibold"
            >
              ← Back to Dashboard
            </Link>
            <h1 className="text-4xl font-bold text-primary-600 mb-2 drop-shadow-md">📊 Analytics & Insights</h1>
            {activeBaby && (
              <p className="text-gray-800 font-medium dark:text-gray-400">
                Data insights for <span className="text-primary-600 font-bold">{activeBaby.name}</span>
              </p>
            )}
          </div>

          {!activeBaby ? (
            <Card>
              <div className="text-center py-12">
                <div className="text-6xl mb-4">👶</div>
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                  Please add a baby profile to view analytics
                </p>
                <Link href="/settings">
                  <Button>Add Baby</Button>
                </Link>
              </div>
            </Card>
          ) : (
            <>
              {/* Date Filter */}
              <div className="mb-6">
                <DateFilter onFilterChange={setDateRange} initialFilter="2weeks" />
              </div>

              {loading ? (
                <LoadingSpinner text="Loading analytics..." />
              ) : (
                <div className="space-y-6">
                  {/* Key Insights */}
                  <Card>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">
                      Key Insights
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-baby-pink rounded-xl">
                        <div className="text-3xl font-bold text-primary-500">
                          {insights.avgFeedingsPerDay}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Feedings/day
                        </div>
                      </div>
                      <div className="text-center p-4 bg-baby-blue rounded-xl">
                        <div className="text-3xl font-bold text-accent-500">
                          {insights.avgSleepPerDay}h
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Sleep/day
                        </div>
                      </div>
                      <div className="text-center p-4 bg-baby-yellow rounded-xl">
                        <div className="text-3xl font-bold text-primary-500">
                          {insights.avgDiapersPerDay}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Diapers/day
                        </div>
                      </div>
                      <div className="text-center p-4 bg-baby-green rounded-xl">
                        <div className="text-3xl font-bold text-green-600">
                          {insights.longestSleepHours}h {insights.longestSleepMins}m
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Longest sleep
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Daily Trends */}
                  <Card>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">
                      Daily Trends
                    </h2>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={dailyTrends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="feedings"
                          stroke="#FF6B8A"
                          name="Feedings"
                        />
                        <Line
                          type="monotone"
                          dataKey="sleep"
                          stroke="#0074FF"
                          name="Sleep (hours)"
                        />
                        <Line
                          type="monotone"
                          dataKey="diapers"
                          stroke="#FBBF24"
                          name="Diapers"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Card>

                  {/* Feeding & Diaper Breakdown */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">
                        Feeding Breakdown
                      </h2>
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={feedingBreakdown}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={(entry) => `${entry.name}: ${entry.value}`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {feedingBreakdown.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </Card>

                    <Card>
                      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">
                        Diaper Breakdown
                      </h2>
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={diaperBreakdown}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={(entry) => entry.value > 0 ? `${entry.name}: ${entry.value}` : ''}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {diaperBreakdown.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </Card>
                  </div>

                  {/* Sleep Patterns */}
                  <Card>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">
                      Sleep Patterns
                    </h2>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={sleepPatterns}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="hours" fill="#0074FF" name="Total Hours" />
                        <Bar dataKey="count" fill="#10B981" name="Session Count" />
                      </BarChart>
                    </ResponsiveContainer>
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
