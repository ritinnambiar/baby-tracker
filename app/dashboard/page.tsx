'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { useActiveBaby } from '@/lib/hooks/useActiveBaby'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PageTransition } from '@/components/ui/PageTransition'
import { SummaryCard } from '@/components/dashboard/SummaryCard'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { DateFilter, DateRange } from '@/components/ui/DateFilter'
import { ReportButton } from '@/components/ui/ReportButton'
import { ReportModal } from '@/components/reports/ReportModal'
import { OverallReport } from '@/components/reports/OverallReport'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { startOfDay, endOfDay, isWithinInterval, parseISO } from 'date-fns'
import { FeedingLog } from '@/lib/types/feeding'
import { SleepLog } from '@/lib/types/sleep'
import { DiaperChange } from '@/lib/types/diaper'
import { PumpingLog } from '@/lib/types/pumping'

interface TodaySummary {
  feeding: {
    count: number
    bottleMl: number
    nursingMinutes: number
  }
  pumping: {
    count: number
    totalMl: number
  }
  sleep: {
    count: number
    totalMinutes: number
  }
  diaper: {
    count: number
    wet: number
    dirty: number
  }
  growth: {
    hasData: boolean
    latest?: {
      weight?: number
      height?: number
    }
  }
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const { activeBaby, babies, loading: babiesLoading } = useActiveBaby()
  const router = useRouter()
  const supabase = createClient()
  const [summary, setSummary] = useState<TodaySummary | null>(null)
  const [loadingSummary, setLoadingSummary] = useState(true)
  const [showReport, setShowReport] = useState(false)
  const [loadingReport, setLoadingReport] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(new Date().setDate(new Date().getDate() - 7)),
    end: new Date(),
    label: 'Last 7 Days',
  })
  const [reportData, setReportData] = useState<{
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

  // Fetch today's summary
  useEffect(() => {
    const fetchTodaySummary = async () => {
      if (!activeBaby) {
        setLoadingSummary(false)
        return
      }

      try {
        const today = new Date()
        const startOfToday = startOfDay(today).toISOString()
        const endOfToday = endOfDay(today).toISOString()

        // Fetch feeding data
        const { data: feedings } = await supabase
          .from('feeding_logs')
          .select('*')
          .eq('baby_id', activeBaby.id)
          .gte('started_at', startOfToday)
          .lte('started_at', endOfToday)

        // Fetch pumping data
        const { data: pumpings } = await supabase
          .from('pumping_logs')
          .select('*')
          .eq('baby_id', activeBaby.id)
          .gte('started_at', startOfToday)
          .lte('started_at', endOfToday)

        // Fetch sleep data
        const { data: sleeps } = await supabase
          .from('sleep_logs')
          .select('*')
          .eq('baby_id', activeBaby.id)
          .gte('started_at', startOfToday)
          .lte('started_at', endOfToday)

        // Fetch diaper data
        const { data: diapers } = await supabase
          .from('diaper_changes')
          .select('*')
          .eq('baby_id', activeBaby.id)
          .gte('changed_at', startOfToday)
          .lte('changed_at', endOfToday)

        // Fetch latest growth data
        const { data: growth } = await supabase
          .from('growth_measurements')
          .select('*')
          .eq('baby_id', activeBaby.id)
          .order('measured_at', { ascending: false })
          .limit(1)

        // Calculate summaries
        const feedingSummary = {
          count: feedings?.length || 0,
          bottleMl: feedings?.reduce((sum, f) => sum + (f.feeding_type === 'bottle' ? f.amount_ml || 0 : 0), 0) || 0,
          nursingMinutes: feedings?.reduce((sum, f) =>
            sum + (f.feeding_type === 'breast' ? (f.left_duration_minutes || 0) + (f.right_duration_minutes || 0) : 0), 0) || 0,
        }

        const pumpingSummary = {
          count: pumpings?.length || 0,
          totalMl: pumpings?.reduce((sum, p) => sum + (p.total_amount_ml || 0), 0) || 0,
        }

        const sleepSummary = {
          count: sleeps?.length || 0,
          totalMinutes: sleeps?.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) || 0,
        }

        const diaperSummary = {
          count: diapers?.length || 0,
          wet: diapers?.filter(d => d.is_wet).length || 0,
          dirty: diapers?.filter(d => d.is_dirty).length || 0,
        }

        const growthSummary = {
          hasData: growth && growth.length > 0,
          latest: growth?.[0] ? {
            weight: growth[0].weight_kg,
            height: growth[0].height_cm,
          } : undefined,
        }

        setSummary({
          feeding: feedingSummary,
          pumping: pumpingSummary,
          sleep: sleepSummary,
          diaper: diaperSummary,
          growth: growthSummary,
        })
      } catch (error) {
        console.error('Error fetching today summary:', error)
      } finally {
        setLoadingSummary(false)
      }
    }

    fetchTodaySummary()
  }, [activeBaby, supabase])

  const handleGenerateReport = async () => {
    if (!activeBaby) return

    setLoadingReport(true)
    try {
      const startDate = dateRange.start.toISOString()
      const endDate = dateRange.end.toISOString()

      // Fetch all data for the date range
      const [feedingsRes, sleepsRes, diapersRes, pumpingsRes] = await Promise.all([
        supabase
          .from('feeding_logs')
          .select('*')
          .eq('baby_id', activeBaby.id)
          .gte('started_at', startDate)
          .lte('started_at', endDate)
          .order('started_at', { ascending: false }),
        supabase
          .from('sleep_logs')
          .select('*')
          .eq('baby_id', activeBaby.id)
          .gte('started_at', startDate)
          .lte('started_at', endDate)
          .order('started_at', { ascending: false }),
        supabase
          .from('diaper_changes')
          .select('*')
          .eq('baby_id', activeBaby.id)
          .gte('changed_at', startDate)
          .lte('changed_at', endDate)
          .order('changed_at', { ascending: false }),
        supabase
          .from('pumping_logs')
          .select('*')
          .eq('baby_id', activeBaby.id)
          .gte('started_at', startDate)
          .lte('started_at', endDate)
          .order('started_at', { ascending: false }),
      ])

      setReportData({
        feedings: feedingsRes.data || [],
        sleeps: sleepsRes.data || [],
        diapers: diapersRes.data || [],
        pumpings: pumpingsRes.data || [],
      })

      setShowReport(true)
    } catch (error) {
      console.error('Error fetching report data:', error)
      toast.error('Failed to generate report')
    } finally {
      setLoadingReport(false)
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      toast.success('Logged out successfully')
      router.push('/login')
      router.refresh()
    } catch (error) {
      toast.error('Failed to log out')
    }
  }

  const formatSleepTime = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (mins === 0) return `${hours}h`
    return `${hours}h ${mins}m`
  }

  if (authLoading || babiesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-baby-pink via-baby-blue to-baby-yellow">
        <LoadingSpinner size="lg" text="Loading your baby tracker..." />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-baby-pink via-baby-blue to-baby-yellow p-4 md:p-8 page-content-mobile">
        <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
          <div>
            <Link href="/dashboard" className="inline-block">
              <h1 className="text-4xl font-bold text-primary-500 mb-2 hover:text-primary-600 transition-colors cursor-pointer">
                Baby Tracker 👶
              </h1>
            </Link>
            {activeBaby ? (
              <p className="text-gray-600">
                Tracking for <span className="font-semibold text-primary-600">{activeBaby.name}</span>
              </p>
            ) : (
              <p className="text-gray-600">{user.email}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Link href="/settings">
              <Button variant="outline">Settings</Button>
            </Link>
            <Button variant="outline" onClick={handleLogout}>
              Log Out
            </Button>
          </div>
        </div>

        {/* Dashboard Content */}
        {!activeBaby && babies.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👶</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Welcome to Baby Tracker!
              </h2>
              <p className="text-gray-600 mb-8">
                Let's get started by adding your baby's information
              </p>
              <Link href="/settings">
                <Button size="lg">Add Your Baby</Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="bg-white rounded-3xl shadow-soft p-8">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Today's Summary
              </h2>
              <p className="text-gray-600">
                {activeBaby && `Tracking for ${activeBaby.name}`}
              </p>
            </div>

            {loadingSummary ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner text="Loading today's summary..." />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                {/* Feeding Card */}
                <SummaryCard href="/feeding" bgColor="bg-baby-pink" icon="🍼" title="Feeding">
                  {summary && summary.feeding.count > 0 ? (
                    <div className="text-sm text-gray-700 space-y-1">
                      <div className="font-medium text-primary-600">{summary.feeding.count} feedings</div>
                      {summary.feeding.bottleMl > 0 && (
                        <div>🍼 {summary.feeding.bottleMl} ml</div>
                      )}
                      {summary.feeding.nursingMinutes > 0 && (
                        <div>🤱 {summary.feeding.nursingMinutes} min</div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">No feedings today</p>
                  )}
                </SummaryCard>

                {/* Pumping Card */}
                <SummaryCard href="/pumping" bgColor="bg-baby-purple" icon="💧" title="Pumping">
                  {summary && summary.pumping.count > 0 ? (
                    <div className="text-sm text-gray-700 space-y-1">
                      <div className="font-medium text-primary-600">{summary.pumping.count} sessions</div>
                      <div>💧 {summary.pumping.totalMl} ml total</div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">No pumping today</p>
                  )}
                </SummaryCard>

                {/* Sleep Card */}
                <SummaryCard href="/sleep" bgColor="bg-baby-blue" icon="😴" title="Sleep">
                  {summary && summary.sleep.count > 0 ? (
                    <div className="text-sm text-gray-700 space-y-1">
                      <div className="font-medium text-primary-600">{summary.sleep.count} sessions</div>
                      <div>😴 {formatSleepTime(summary.sleep.totalMinutes)} total</div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">No sleep logged today</p>
                  )}
                </SummaryCard>

                {/* Diaper Card */}
                <SummaryCard href="/diaper" bgColor="bg-baby-yellow" icon="🎯" title="Diapers">
                  {summary && summary.diaper.count > 0 ? (
                    <div className="text-sm text-gray-700 space-y-1">
                      <div className="font-medium text-primary-600">{summary.diaper.count} changes</div>
                      <div className="flex gap-2">
                        {summary.diaper.wet > 0 && <span>💧 {summary.diaper.wet}</span>}
                        {summary.diaper.dirty > 0 && <span>💩 {summary.diaper.dirty}</span>}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">No changes today</p>
                  )}
                </SummaryCard>

                {/* Growth Card */}
                <SummaryCard href="/growth" bgColor="bg-baby-green" icon="📊" title="Growth">
                  {summary && summary.growth.hasData ? (
                    <div className="text-sm text-gray-700 space-y-1">
                      {summary.growth.latest?.weight && (
                        <div>⚖️ {summary.growth.latest.weight} kg</div>
                      )}
                      {summary.growth.latest?.height && (
                        <div>📏 {summary.growth.latest.height} cm</div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">No measurements yet</p>
                  )}
                </SummaryCard>
              </div>
            )}
          </div>
        )}

        {/* Overall Report Generation */}
        {activeBaby && (
          <div className="mt-8">
            <Card>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">📊 Generate Overall Report</h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Create a comprehensive report with all tracking data for a specific date range
                </p>
              </div>

              <div className="space-y-4">
                <DateFilter
                  onFilterChange={setDateRange}
                  initialFilter="week"
                />

                <div className="flex justify-end">
                  <ReportButton
                    onClick={handleGenerateReport}
                    disabled={loadingReport}
                  />
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Report Modal */}
        {activeBaby && (
          <ReportModal
            isOpen={showReport}
            onClose={() => setShowReport(false)}
            title="Overall Baby Care Report"
            dateRange={dateRange}
            babyName={activeBaby.name}
            feedings={reportData.feedings}
            sleeps={reportData.sleeps}
            diapers={reportData.diapers}
            pumpings={reportData.pumpings}
          >
            <OverallReport
              feedings={reportData.feedings}
              sleeps={reportData.sleeps}
              diapers={reportData.diapers}
              pumpings={reportData.pumpings}
              dateRange={dateRange}
              babyName={activeBaby.name}
            />
          </ReportModal>
        )}
        </div>
      </div>
    </PageTransition>
  )
}
