'use client'

import { FeedingLog } from '@/lib/types/feeding'
import { format, parseISO } from 'date-fns'

interface FeedingReportProps {
  feedings: FeedingLog[]
  dateRange: { start: Date; end: Date }
}

export function FeedingReport({ feedings, dateRange }: FeedingReportProps) {
  // Calculate statistics
  const totalFeedings = feedings.length
  const bottleFeedings = feedings.filter(f => f.feeding_type === 'bottle')
  const breastFeedings = feedings.filter(f => f.feeding_type === 'breast')

  const totalBottleMl = bottleFeedings.reduce((sum, f) => sum + (f.amount_ml || 0), 0)
  const avgBottleMl = bottleFeedings.length > 0 ? Math.round(totalBottleMl / bottleFeedings.length) : 0

  const totalNursingMinutes = breastFeedings.reduce((sum, f) =>
    sum + (f.left_duration_minutes || 0) + (f.right_duration_minutes || 0), 0
  )
  const avgNursingMinutes = breastFeedings.length > 0 ? Math.round(totalNursingMinutes / breastFeedings.length) : 0

  // Calculate daily average
  const daysDiff = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)) || 1
  const avgFeedingsPerDay = (totalFeedings / daysDiff).toFixed(1)

  // Group by date for daily breakdown
  const dailyBreakdown: { [key: string]: FeedingLog[] } = {}
  feedings.forEach(feeding => {
    const date = format(parseISO(feeding.started_at), 'yyyy-MM-dd')
    if (!dailyBreakdown[date]) {
      dailyBreakdown[date] = []
    }
    dailyBreakdown[date].push(feeding)
  })

  const sortedDates = Object.keys(dailyBreakdown).sort((a, b) => b.localeCompare(a))

  return (
    <div className="space-y-8">
      {/* Summary Statistics */}
      <section>
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Summary Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-baby-pink dark:bg-opacity-20 rounded-2xl p-4 print:border print:border-gray-300">
            <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">{totalFeedings}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Total Feedings</div>
          </div>
          <div className="bg-baby-blue dark:bg-opacity-20 rounded-2xl p-4 print:border print:border-gray-300">
            <div className="text-3xl font-bold text-accent-600 dark:text-accent-400">{avgFeedingsPerDay}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Avg. Per Day</div>
          </div>
          <div className="bg-baby-yellow dark:bg-opacity-20 rounded-2xl p-4 print:border print:border-gray-300">
            <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">{bottleFeedings.length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Bottle Feedings</div>
          </div>
          <div className="bg-baby-green dark:bg-opacity-20 rounded-2xl p-4 print:border print:border-gray-300">
            <div className="text-3xl font-bold text-accent-600 dark:text-accent-400">{breastFeedings.length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Breast Feedings</div>
          </div>
        </div>
      </section>

      {/* Bottle Feeding Details */}
      {bottleFeedings.length > 0 && (
        <section>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Bottle Feeding Details</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-700 rounded-2xl p-4 shadow-soft print:border print:border-gray-300">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalBottleMl} ml</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Total Volume</div>
            </div>
            <div className="bg-white dark:bg-gray-700 rounded-2xl p-4 shadow-soft print:border print:border-gray-300">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{avgBottleMl} ml</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Avg. Per Feeding</div>
            </div>
            <div className="bg-white dark:bg-gray-700 rounded-2xl p-4 shadow-soft print:border print:border-gray-300">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{Math.round(totalBottleMl / daysDiff)} ml</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Avg. Per Day</div>
            </div>
          </div>
        </section>
      )}

      {/* Breast Feeding Details */}
      {breastFeedings.length > 0 && (
        <section>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Breast Feeding Details</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-700 rounded-2xl p-4 shadow-soft print:border print:border-gray-300">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalNursingMinutes} min</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Total Duration</div>
            </div>
            <div className="bg-white dark:bg-gray-700 rounded-2xl p-4 shadow-soft print:border print:border-gray-300">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{avgNursingMinutes} min</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Avg. Per Session</div>
            </div>
            <div className="bg-white dark:bg-gray-700 rounded-2xl p-4 shadow-soft print:border print:border-gray-300">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{Math.round(totalNursingMinutes / daysDiff)} min</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Avg. Per Day</div>
            </div>
          </div>
        </section>
      )}

      {/* Daily Breakdown */}
      <section className="print:break-before-page">
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Daily Breakdown</h3>
        <div className="space-y-4">
          {sortedDates.map(date => {
            const dayFeedings = dailyBreakdown[date]
            const dayBottle = dayFeedings.filter(f => f.feeding_type === 'bottle')
            const dayBreast = dayFeedings.filter(f => f.feeding_type === 'breast')
            const dayBottleMl = dayBottle.reduce((sum, f) => sum + (f.amount_ml || 0), 0)
            const dayNursingMin = dayBreast.reduce((sum, f) =>
              sum + (f.left_duration_minutes || 0) + (f.right_duration_minutes || 0), 0
            )

            return (
              <div key={date} className="bg-white dark:bg-gray-700 rounded-2xl p-4 shadow-soft print:border print:border-gray-300">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-gray-100">
                      {format(parseISO(date), 'EEEE, MMMM d, yyyy')}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {dayFeedings.length} feeding{dayFeedings.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    {dayBottle.length > 0 && (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        🍼 {dayBottle.length}x · {dayBottleMl}ml
                      </div>
                    )}
                    {dayBreast.length > 0 && (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        🤱 {dayBreast.length}x · {dayNursingMin}min
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  {dayFeedings.map(feeding => (
                    <div key={feeding.id} className="text-sm flex justify-between border-t border-gray-100 dark:border-gray-600 pt-2">
                      <span className="text-gray-600 dark:text-gray-400">
                        {format(parseISO(feeding.started_at), 'h:mm a')}
                      </span>
                      <span className="text-gray-900 dark:text-gray-100 font-medium">
                        {feeding.feeding_type === 'bottle'
                          ? `${feeding.amount_ml}ml Bottle`
                          : `Breast ${feeding.left_duration_minutes || 0}min L / ${feeding.right_duration_minutes || 0}min R`
                        }
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
        <div className="bg-baby-blue dark:bg-opacity-20 rounded-2xl p-6 print:border print:border-gray-300">
          <ul className="space-y-2 text-gray-700 dark:text-gray-300">
            <li>• Your baby averaged <strong>{avgFeedingsPerDay} feedings per day</strong> during this period</li>
            {bottleFeedings.length > 0 && (
              <li>• Average bottle feeding was <strong>{avgBottleMl}ml</strong></li>
            )}
            {breastFeedings.length > 0 && (
              <li>• Average nursing session lasted <strong>{avgNursingMinutes} minutes</strong></li>
            )}
            {bottleFeedings.length > 0 && breastFeedings.length > 0 && (
              <li>• Feeding split: <strong>{Math.round(bottleFeedings.length / totalFeedings * 100)}% bottle</strong> and <strong>{Math.round(breastFeedings.length / totalFeedings * 100)}% breast</strong></li>
            )}
          </ul>
        </div>
      </section>
    </div>
  )
}
