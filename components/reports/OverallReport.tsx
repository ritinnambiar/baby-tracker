'use client'

import { FeedingLog } from '@/lib/types/feeding'
import { SleepLog } from '@/lib/types/sleep'
import { DiaperChange } from '@/lib/types/diaper'
import { PumpingLog } from '@/lib/types/pumping'
import { format, parseISO } from 'date-fns'

interface OverallReportProps {
  feedings: FeedingLog[]
  sleeps: SleepLog[]
  diapers: DiaperChange[]
  pumpings: PumpingLog[]
  dateRange: { start: Date; end: Date }
  babyName: string
}

export function OverallReport({ feedings, sleeps, diapers, pumpings, dateRange, babyName }: OverallReportProps) {
  // Calculate date range
  const daysDiff = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)) || 1

  // Feeding stats
  const totalFeedings = feedings.length
  const bottleFeedings = feedings.filter(f => f.feeding_type === 'bottle')
  const breastFeedings = feedings.filter(f => f.feeding_type === 'breast')
  const totalBottleMl = bottleFeedings.reduce((sum, f) => sum + (f.amount_ml || 0), 0)
  const totalNursingMinutes = breastFeedings.reduce((sum, f) =>
    sum + (f.left_duration_minutes || 0) + (f.right_duration_minutes || 0), 0
  )
  const avgFeedingsPerDay = (totalFeedings / daysDiff).toFixed(1)

  // Sleep stats
  const totalSleeps = sleeps.length
  const naps = sleeps.filter(s => s.sleep_type === 'nap')
  const nights = sleeps.filter(s => s.sleep_type === 'night')
  const totalSleepMinutes = sleeps.reduce((sum, s) => sum + (s.duration_minutes || 0), 0)
  const totalSleepHours = Math.floor(totalSleepMinutes / 60)
  const totalSleepMins = totalSleepMinutes % 60
  const avgSleepHoursPerDay = (totalSleepMinutes / daysDiff / 60).toFixed(1)
  const longestSleep = sleeps.reduce((max, s) => Math.max(max, s.duration_minutes || 0), 0)

  // Diaper stats
  const totalDiapers = diapers.length
  const wetOnly = diapers.filter(d => d.is_wet && !d.is_dirty).length
  const dirtyOnly = diapers.filter(d => d.is_dirty && !d.is_wet).length
  const both = diapers.filter(d => d.is_wet && d.is_dirty).length
  const avgDiapersPerDay = (totalDiapers / daysDiff).toFixed(1)

  // Pumping stats
  const totalPumpingSessions = pumpings.length
  const totalPumpedMl = pumpings.reduce((sum, p) => sum + (p.total_amount_ml || 0), 0)
  const avgPumpedPerSession = totalPumpingSessions > 0 ? Math.round(totalPumpedMl / totalPumpingSessions) : 0

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (mins === 0) return `${hours}h`
    return `${hours}h ${mins}m`
  }

  return (
    <div className="report-container">
      {/* Report Header */}
      <section className="report-header text-center pb-4 sm:pb-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Overall Baby Care Report</h2>
        <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-400">
          {format(dateRange.start, 'MMM d, yyyy')} - {format(dateRange.end, 'MMM d, yyyy')}
        </p>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-500 mt-1">
          {daysDiff} day{daysDiff !== 1 ? 's' : ''} of tracking
        </p>
      </section>

      {/* Print Title - Hidden on screen */}
      <div className="print-title">
        <h1 className="text-5xl font-bold text-gray-100 mb-6 text-center">Overall Baby Care Report</h1>
        <div className="bg-gradient-to-r from-baby-pink to-baby-blue rounded-2xl p-8 mb-8 mx-auto max-w-2xl text-center">
          <p className="text-3xl font-bold text-gray-100 mb-4">{babyName}</p>
          <p className="text-2xl font-semibold text-gray-100 mb-3">
            {format(dateRange.start, 'MMMM d, yyyy')} - {format(dateRange.end, 'MMMM d, yyyy')}
          </p>
          <p className="text-lg text-gray-200">
            {daysDiff} day{daysDiff !== 1 ? 's' : ''} of tracking data
          </p>
        </div>
      </div>

      {/* Summary Overview - Page 1 content */}
      <section className="summary-section">
        <h3 className="summary-heading text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">Summary Overview</h3>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
          <div className="bg-baby-pink dark:bg-opacity-20 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 text-center">
            <div className="text-2xl sm:text-3xl md:text-4xl mb-1 sm:mb-2">🍼</div>
            <div className="text-xl sm:text-2xl md:text-3xl font-bold text-primary-600 dark:text-primary-400">{totalFeedings}</div>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">Feedings</div>
          </div>
          <div className="bg-baby-purple dark:bg-opacity-20 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 text-center">
            <div className="text-2xl sm:text-3xl md:text-4xl mb-1 sm:mb-2">😴</div>
            <div className="text-xl sm:text-2xl md:text-3xl font-bold text-accent-600 dark:text-accent-400">{totalSleeps}</div>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">Sleep Sessions</div>
          </div>
          <div className="bg-baby-yellow dark:bg-opacity-20 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 text-center">
            <div className="text-2xl sm:text-3xl md:text-4xl mb-1 sm:mb-2">🎯</div>
            <div className="text-xl sm:text-2xl md:text-3xl font-bold text-primary-600 dark:text-primary-400">{totalDiapers}</div>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">Diaper Changes</div>
          </div>
          <div className="bg-baby-blue dark:bg-opacity-20 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 text-center">
            <div className="text-2xl sm:text-3xl md:text-4xl mb-1 sm:mb-2">🫗</div>
            <div className="text-xl sm:text-2xl md:text-3xl font-bold text-accent-600 dark:text-accent-400">{totalPumpingSessions}</div>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">Pumping Sessions</div>
          </div>
        </div>
      </section>

      {/* Page 2 Header - Hidden on screen */}
      <div className="page-2-header">
        <h2 className="text-3xl font-bold text-gray-100 mb-8 text-center">Detailed Statistics</h2>
      </div>

      {/* Detailed Statistics - Page 2 content - WRAP ALL DETAILS */}
      <div className="details-section space-y-4 sm:space-y-6 md:space-y-8">
        <section>
          <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">📊 Feeding Statistics</h3>
          <div className="bg-white dark:bg-gray-700 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 shadow-soft space-y-3 sm:space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Feedings</div>
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">{totalFeedings}</div>
              </div>
              <div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Avg. Per Day</div>
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">{avgFeedingsPerDay}</div>
              </div>
              <div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Bottle Feedings</div>
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">{bottleFeedings.length}</div>
              </div>
              <div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Breast Feedings</div>
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">{breastFeedings.length}</div>
              </div>
              <div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Bottle</div>
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">{totalBottleMl} ml</div>
              </div>
              <div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Nursing</div>
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">{formatDuration(totalNursingMinutes)}</div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">😴 Sleep Statistics</h3>
          <div className="bg-white dark:bg-gray-700 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 shadow-soft space-y-3 sm:space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Sleep</div>
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">{totalSleepHours}h {totalSleepMins}m</div>
              </div>
              <div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Avg. Per Day</div>
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">{avgSleepHoursPerDay}h</div>
              </div>
              <div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Naps</div>
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">{naps.length}</div>
              </div>
              <div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Night Sleeps</div>
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">{nights.length}</div>
              </div>
              <div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Longest Sleep</div>
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">{formatDuration(longestSleep)}</div>
              </div>
              <div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Sessions</div>
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">{totalSleeps}</div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">🎯 Diaper Statistics</h3>
          <div className="bg-white dark:bg-gray-700 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 shadow-soft space-y-3 sm:space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Changes</div>
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">{totalDiapers}</div>
              </div>
              <div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Avg. Per Day</div>
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">{avgDiapersPerDay}</div>
              </div>
              <div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Wet Only</div>
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">{wetOnly}</div>
              </div>
              <div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Dirty Only</div>
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">{dirtyOnly}</div>
              </div>
              <div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Both</div>
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">{both}</div>
              </div>
              <div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Wet</div>
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">{wetOnly + both}</div>
              </div>
            </div>
          </div>
        </section>

        {totalPumpingSessions > 0 && (
          <section>
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">🫗 Pumping Statistics</h3>
            <div className="bg-white dark:bg-gray-700 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 shadow-soft space-y-3 sm:space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Sessions</div>
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">{totalPumpingSessions}</div>
                </div>
                <div>
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Pumped</div>
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">{totalPumpedMl} ml</div>
                </div>
                <div>
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Avg. Per Session</div>
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">{avgPumpedPerSession} ml</div>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Page 3 Header - Hidden on screen */}
      <div className="page-3-header">
        <h2 className="text-3xl font-bold text-gray-100 mb-8 text-center">Key Insights</h2>
      </div>

      {/* Key Insights - Page 3 content */}
      <div className="insights-section">
        <section>
          <h3 className="insights-heading text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">💡 Key Insights</h3>
          <div className="bg-gradient-to-r from-baby-pink to-baby-blue dark:bg-opacity-20 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6">
            <ul className="space-y-2 sm:space-y-3 text-sm sm:text-base text-gray-700 dark:text-gray-300">
              <li className="flex items-start">
                <span className="mr-2 flex-shrink-0">•</span>
                <span>Your baby averaged <strong>{avgFeedingsPerDay} feedings per day</strong> and <strong>{avgSleepHoursPerDay} hours of sleep per day</strong></span>
              </li>
              {bottleFeedings.length > 0 && (
                <li className="flex items-start">
                  <span className="mr-2 flex-shrink-0">•</span>
                  <span>Consumed an average of <strong>{Math.round(totalBottleMl / daysDiff)} ml of formula/milk per day</strong></span>
                </li>
              )}
              <li className="flex items-start">
                <span className="mr-2 flex-shrink-0">•</span>
                <span>Required <strong>{avgDiapersPerDay} diaper changes per day</strong> on average</span>
              </li>
              {longestSleep > 0 && (
                <li className="flex items-start">
                  <span className="mr-2 flex-shrink-0">•</span>
                  <span>Longest sleep stretch was <strong>{formatDuration(longestSleep)}</strong></span>
                </li>
              )}
              {naps.length > 0 && (
                <li className="flex items-start">
                  <span className="mr-2 flex-shrink-0">•</span>
                  <span>Took an average of <strong>{(naps.length / daysDiff).toFixed(1)} naps per day</strong></span>
                </li>
              )}
              {totalPumpingSessions > 0 && (
                <li className="flex items-start">
                  <span className="mr-2 flex-shrink-0">•</span>
                  <span>Average pumping output was <strong>{avgPumpedPerSession} ml per session</strong></span>
                </li>
              )}
            </ul>
          </div>
        </section>
      </div>

      {/* Print Footer - Hidden on screen */}
      <div className="print-footer">
        <p className="text-sm text-gray-400 text-center">
          Baby Tracker - Comprehensive Care Report
        </p>
        <p className="text-xs text-gray-500 mt-2 text-center">
          This report was generated on {format(new Date(), 'MMMM d, yyyy')} at {format(new Date(), 'h:mm a')}
        </p>
      </div>
    </div>
  )
}
