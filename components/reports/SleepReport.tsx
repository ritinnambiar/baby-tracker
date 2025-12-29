'use client'

import { SleepLog } from '@/lib/types/sleep'
import { format, parseISO } from 'date-fns'

interface SleepReportProps {
  sleeps: SleepLog[]
  dateRange: { start: Date; end: Date }
}

export function SleepReport({ sleeps, dateRange }: SleepReportProps) {
  // Calculate statistics
  const totalSessions = sleeps.length
  const naps = sleeps.filter(s => s.sleep_type === 'nap')
  const nights = sleeps.filter(s => s.sleep_type === 'night')

  const totalMinutes = sleeps.reduce((sum, s) => sum + (s.duration_minutes || 0), 0)
  const totalHours = Math.floor(totalMinutes / 60)
  const totalMins = totalMinutes % 60

  const napMinutes = naps.reduce((sum, s) => sum + (s.duration_minutes || 0), 0)
  const nightMinutes = nights.reduce((sum, s) => sum + (s.duration_minutes || 0), 0)

  const avgNapDuration = naps.length > 0 ? Math.round(napMinutes / naps.length) : 0
  const avgNightDuration = nights.length > 0 ? Math.round(nightMinutes / nights.length) : 0

  const longestSleep = sleeps.reduce((max, s) => Math.max(max, s.duration_minutes || 0), 0)

  // Daily average
  const daysDiff = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)) || 1
  const avgHoursPerDay = (totalMinutes / daysDiff / 60).toFixed(1)
  const avgNapsPerDay = (naps.length / daysDiff).toFixed(1)

  // Group by date
  const dailyBreakdown: { [key: string]: SleepLog[] } = {}
  sleeps.forEach(sleep => {
    const date = format(parseISO(sleep.started_at), 'yyyy-MM-dd')
    if (!dailyBreakdown[date]) {
      dailyBreakdown[date] = []
    }
    dailyBreakdown[date].push(sleep)
  })

  const sortedDates = Object.keys(dailyBreakdown).sort((a, b) => b.localeCompare(a))

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (mins === 0) return `${hours}h`
    return `${hours}h ${mins}m`
  }

  return (
    <div className="space-y-8">
      {/* Summary Statistics */}
      <section>
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Summary Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-baby-purple dark:bg-opacity-20 rounded-2xl p-4 print:border print:border-gray-300">
            <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">{totalSessions}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Total Sessions</div>
          </div>
          <div className="bg-baby-blue dark:bg-opacity-20 rounded-2xl p-4 print:border print:border-gray-300">
            <div className="text-3xl font-bold text-accent-600 dark:text-accent-400">{totalHours}h {totalMins}m</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Total Sleep</div>
          </div>
          <div className="bg-baby-yellow dark:bg-opacity-20 rounded-2xl p-4 print:border print:border-gray-300">
            <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">{naps.length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Naps</div>
          </div>
          <div className="bg-baby-pink dark:bg-opacity-20 rounded-2xl p-4 print:border print:border-gray-300">
            <div className="text-3xl font-bold text-accent-600 dark:text-accent-400">{nights.length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Night Sleeps</div>
          </div>
        </div>
      </section>

      {/* Sleep Details */}
      <section>
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Sleep Details</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-700 rounded-2xl p-4 shadow-soft print:border print:border-gray-300">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{avgHoursPerDay}h</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Avg. Per Day</div>
          </div>
          <div className="bg-white dark:bg-gray-700 rounded-2xl p-4 shadow-soft print:border print:border-gray-300">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatDuration(avgNapDuration)}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Avg. Nap</div>
          </div>
          <div className="bg-white dark:bg-gray-700 rounded-2xl p-4 shadow-soft print:border print:border-gray-300">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatDuration(avgNightDuration)}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Avg. Night</div>
          </div>
          <div className="bg-white dark:bg-gray-700 rounded-2xl p-4 shadow-soft print:border print:border-gray-300">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatDuration(longestSleep)}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Longest Sleep</div>
          </div>
        </div>
      </section>

      {/* Daily Breakdown */}
      <section className="print:break-before-page">
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Daily Breakdown</h3>
        <div className="space-y-4">
          {sortedDates.map(date => {
            const daySleeps = dailyBreakdown[date]
            const dayNaps = daySleeps.filter(s => s.sleep_type === 'nap')
            const dayNights = daySleeps.filter(s => s.sleep_type === 'night')
            const dayTotal = daySleeps.reduce((sum, s) => sum + (s.duration_minutes || 0), 0)

            return (
              <div key={date} className="bg-white dark:bg-gray-700 rounded-2xl p-4 shadow-soft print:border print:border-gray-300">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-gray-100">
                      {format(parseISO(date), 'EEEE, MMMM d, yyyy')}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {daySleeps.length} session{daySleeps.length !== 1 ? 's' : ''} · {formatDuration(dayTotal)} total
                    </p>
                  </div>
                  <div className="text-right">
                    {dayNaps.length > 0 && (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        💤 {dayNaps.length} nap{dayNaps.length !== 1 ? 's' : ''}
                      </div>
                    )}
                    {dayNights.length > 0 && (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        🌙 {dayNights.length} night
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  {daySleeps.map(sleep => (
                    <div key={sleep.id} className="text-sm flex justify-between border-t border-gray-100 dark:border-gray-600 pt-2">
                      <span className="text-gray-600 dark:text-gray-400">
                        {format(parseISO(sleep.started_at), 'h:mm a')}
                        {sleep.ended_at && ` - ${format(parseISO(sleep.ended_at), 'h:mm a')}`}
                      </span>
                      <span className="text-gray-900 dark:text-gray-100 font-medium">
                        {sleep.sleep_type === 'nap' ? '💤' : '🌙'} {formatDuration(sleep.duration_minutes || 0)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Insights */}
      <section>
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Insights</h3>
        <div className="bg-baby-purple dark:bg-opacity-20 rounded-2xl p-6 print:border print:border-gray-300">
          <ul className="space-y-2 text-gray-700 dark:text-gray-300">
            <li>• Your baby slept an average of <strong>{avgHoursPerDay} hours per day</strong></li>
            <li>• Averaged <strong>{avgNapsPerDay} naps per day</strong></li>
            {avgNapDuration > 0 && (
              <li>• Average nap duration was <strong>{formatDuration(avgNapDuration)}</strong></li>
            )}
            {avgNightDuration > 0 && (
              <li>• Average night sleep was <strong>{formatDuration(avgNightDuration)}</strong></li>
            )}
            <li>• Longest sleep stretch was <strong>{formatDuration(longestSleep)}</strong></li>
          </ul>
        </div>
      </section>
    </div>
  )
}
