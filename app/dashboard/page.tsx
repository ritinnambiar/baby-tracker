'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { useActiveBaby } from '@/lib/hooks/useActiveBaby'
import { useTheme } from '@/lib/hooks/useTheme'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PageTransition } from '@/components/ui/PageTransition'
import { SummaryCard } from '@/components/dashboard/SummaryCard'
import { QuickStats } from '@/components/dashboard/QuickStats'
import { DailyNotes } from '@/components/dashboard/DailyNotes'
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
import { differenceInMonths } from 'date-fns'
import { COMMON_MILESTONES } from '@/lib/constants/milestones'

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
  const { currentTheme } = useTheme()
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
  const [latestActivities, setLatestActivities] = useState<{
    lastFeeding?: FeedingLog
    lastSleep?: SleepLog
    lastDiaper?: DiaperChange
    lastPumping?: PumpingLog
  }>({})
  const [nextVaccine, setNextVaccine] = useState<any>(null)
  const [upcomingMilestone, setUpcomingMilestone] = useState<any>(null)

  // Fetch latest activities for Quick Stats
  useEffect(() => {
    const fetchLatestActivities = async () => {
      if (!activeBaby) return

      try {
        const [feedingRes, sleepRes, diaperRes, pumpingRes] = await Promise.all([
          supabase
            .from('feeding_logs')
            .select('*')
            .eq('baby_id', activeBaby.id)
            .order('started_at', { ascending: false })
            .limit(1)
            .single(),
          supabase
            .from('sleep_logs')
            .select('*')
            .eq('baby_id', activeBaby.id)
            .order('started_at', { ascending: false })
            .limit(1)
            .single(),
          supabase
            .from('diaper_changes')
            .select('*')
            .eq('baby_id', activeBaby.id)
            .order('changed_at', { ascending: false })
            .limit(1)
            .single(),
          supabase
            .from('pumping_logs')
            .select('*')
            .eq('baby_id', activeBaby.id)
            .order('started_at', { ascending: false })
            .limit(1)
            .single(),
        ])

        setLatestActivities({
          lastFeeding: feedingRes.data || undefined,
          lastSleep: sleepRes.data || undefined,
          lastDiaper: diaperRes.data || undefined,
          lastPumping: pumpingRes.data || undefined,
        })
      } catch (error) {
        console.error('Error fetching latest activities:', error)
      }
    }

    fetchLatestActivities()
  }, [activeBaby, supabase])

  // Fetch next upcoming vaccination
  useEffect(() => {
    const fetchNextVaccine = async () => {
      if (!activeBaby) return

      try {
        const babyAgeMonths = differenceInMonths(new Date(), parseISO(activeBaby.date_of_birth))

        const { data: vaccinations } = await supabase
          .from('vaccinations')
          .select('*')
          .eq('baby_id', activeBaby.id)
          .eq('is_completed', false)
          .gte('age_months', babyAgeMonths)
          .order('age_months', { ascending: true })
          .limit(1)
          .single()

        setNextVaccine(vaccinations)
      } catch (error) {
        // No upcoming vaccinations or error
        setNextVaccine(null)
      }
    }

    fetchNextVaccine()
  }, [activeBaby, supabase])

  // Find next upcoming milestone
  useEffect(() => {
    const findUpcomingMilestone = async () => {
      if (!activeBaby) return

      try {
        const babyAgeMonths = differenceInMonths(new Date(), parseISO(activeBaby.date_of_birth))

        // Get all milestones from database and find unachieved ones
        const { data: allMilestones } = await supabase
          .from('milestones')
          .select('milestone_title, achieved_date, milestone_category')
          .eq('baby_id', activeBaby.id)

        // Get titles of achieved milestones (where achieved_date is not null)
        const achievedTitles = new Set(
          allMilestones?.filter(m => m.achieved_date !== null).map(m => m.milestone_title) || []
        )

        // Find next unachieved milestone from common list
        // Show milestones within baby's age range or up to 6 months ahead
        const upcoming = COMMON_MILESTONES
          .filter(m => {
            // Not achieved yet
            if (achievedTitles.has(m.title)) return false

            // Within current age range OR coming up in next 6 months
            return m.ageMonthsMin <= babyAgeMonths + 6 && m.ageMonthsMax >= babyAgeMonths
          })
          .sort((a, b) => a.ageMonthsMin - b.ageMonthsMin)[0]

        setUpcomingMilestone(upcoming || null)
      } catch (error) {
        setUpcomingMilestone(null)
      }
    }

    findUpcomingMilestone()
  }, [activeBaby, supabase])

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
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: currentTheme.gradientCSS }}
      >
        <LoadingSpinner size="lg" text="Loading your baby tracker..." />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <PageTransition>
      <div
        className="min-h-screen p-4 md:p-8 page-content-mobile"
        style={{ background: currentTheme.gradientCSS }}
      >
        <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
          <div>
            <Link href="/dashboard" className="inline-block">
              <h1 className="text-4xl font-bold text-primary-600 mb-2 hover:text-primary-700 transition-colors cursor-pointer drop-shadow-md">
                Baby Tracker 👶
              </h1>
            </Link>
            {activeBaby ? (
              <p className="text-gray-800 font-medium">
                Tracking for <span className="font-bold text-primary-600">{activeBaby.name}</span>
              </p>
            ) : (
              <p className="text-gray-800 font-medium">{user.email}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Link href="/settings">
              <Button variant="outline" className="border-primary-500 text-primary-600 hover:bg-primary-50 font-semibold" aria-label="Go to settings page">Settings</Button>
            </Link>
            <Button variant="outline" onClick={handleLogout} className="border-primary-500 text-primary-600 hover:bg-primary-50 font-semibold" aria-label="Log out of your account">
              Log Out
            </Button>
          </div>
        </header>

        <main id="main-content" aria-label="Dashboard content">

        {/* Quick Stats Widget */}
        {activeBaby && (
          <QuickStats
            lastFeeding={latestActivities.lastFeeding}
            lastSleep={latestActivities.lastSleep}
            lastDiaper={latestActivities.lastDiaper}
            lastPumping={latestActivities.lastPumping}
          />
        )}

        {/* Upcoming Reminders */}
        {activeBaby && (nextVaccine || upcomingMilestone) && (
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {/* Next Vaccination Reminder */}
            {nextVaccine && (
              <Card className="border-2 border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">💉</span>
                      <h3 className="text-lg font-bold text-purple-800 dark:text-purple-200">Upcoming Vaccine</h3>
                    </div>
                    <p className="text-purple-900 dark:text-purple-100 font-semibold mb-1">
                      {nextVaccine.vaccine_name}
                    </p>
                    <p className="text-sm text-purple-700 dark:text-purple-300">
                      At {nextVaccine.age_months} months
                    </p>
                  </div>
                  <Link href="/vaccinations">
                    <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                      View
                    </Button>
                  </Link>
                </div>
              </Card>
            )}

            {/* Upcoming Milestone */}
            {upcomingMilestone && (
              <Card className="border-2 border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">🎯</span>
                      <h3 className="text-lg font-bold text-primary-600 dark:text-yellow-200">Upcoming Milestone</h3>
                    </div>
                    <p className="text-primary-700 dark:text-yellow-100 font-semibold mb-1">
                      {upcomingMilestone.title}
                    </p>
                    <p className="text-sm text-primary-600 dark:text-yellow-300">
                      {upcomingMilestone.ageMonthsMin}-{upcomingMilestone.ageMonthsMax} months
                    </p>
                  </div>
                  <Link href="/milestones">
                    <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700">
                      View
                    </Button>
                  </Link>
                </div>
              </Card>
            )}
          </div>
        )}

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
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                Today's Activity & Features
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {activeBaby && `Tracking for ${activeBaby.name}`}
              </p>
            </div>

            {loadingSummary ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner text="Loading..." />
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

                {/* Vaccinations Card */}
                <SummaryCard href="/vaccinations" bgColor="bg-baby-purple" icon="💉" title="Vaccinations">
                  <p className="text-sm text-gray-700">Track vaccine schedule</p>
                </SummaryCard>

                {/* Medications Card */}
                <SummaryCard href="/medications" bgColor="bg-baby-pink" icon="💊" title="Medications">
                  <p className="text-sm text-gray-700">Manage medications</p>
                </SummaryCard>

                {/* Milestones Card */}
                <SummaryCard href="/milestones" bgColor="bg-baby-yellow" icon="🎯" title="Milestones">
                  <p className="text-sm text-gray-700">Track development</p>
                </SummaryCard>

                {/* Analytics Card */}
                <SummaryCard href="/analytics" bgColor="bg-baby-blue" icon="📈" title="Analytics">
                  <p className="text-sm text-gray-700">View insights</p>
                </SummaryCard>
              </div>
            )}
          </>
        )}

        {/* Overall Report Generation */}
        {activeBaby && (
          <div className="mt-8">
            <Card>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Generate Report</h2>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Export comprehensive PDF report
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <DateFilter
                    onFilterChange={setDateRange}
                    initialFilter="week"
                  />
                </div>
                <ReportButton
                  onClick={handleGenerateReport}
                  disabled={loadingReport}
                />
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
        </main>
        </div>
      </div>
    </PageTransition>
  )
}
