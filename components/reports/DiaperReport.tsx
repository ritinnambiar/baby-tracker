'use client'

import { DiaperChange } from '@/lib/types/diaper'
import { format, parseISO } from 'date-fns'

interface DiaperReportProps {
  diapers: DiaperChange[]
  dateRange: { start: Date; end: Date }
}

export function DiaperReport({ diapers, dateRange }: DiaperReportProps) {
  const totalChanges = diapers.length
  const wetOnly = diapers.filter(d => d.is_wet && !d.is_dirty).length
  const dirtyOnly = diapers.filter(d => d.is_dirty && !d.is_wet).length
  const both = diapers.filter(d => d.is_wet && d.is_dirty).length

  const daysDiff = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)) || 1
  const avgPerDay = (totalChanges / daysDiff).toFixed(1)

  // Group by date
  const dailyBreakdown: { [key: string]: DiaperChange[] } = {}
  diapers.forEach(diaper => {
    const date = format(parseISO(diaper.changed_at), 'yyyy-MM-dd')
    if (!dailyBreakdown[date]) {
      dailyBreakdown[date] = []
    }
    dailyBreakdown[date].push(diaper)
  })

  const sortedDates = Object.keys(dailyBreakdown).sort((a, b) => b.localeCompare(a))

  return (
    <div className="space-y-8">
      {/* Summary Statistics */}
      <section>
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Summary Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-baby-yellow dark:bg-opacity-20 rounded-2xl p-4 print:border print:border-gray-300">
            <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">{totalChanges}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Total Changes</div>
          </div>
          <div className="bg-baby-blue dark:bg-opacity-20 rounded-2xl p-4 print:border print:border-gray-300">
            <div className="text-3xl font-bold text-accent-600 dark:text-accent-400">{avgPerDay}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Avg. Per Day</div>
          </div>
          <div className="bg-baby-pink dark:bg-opacity-20 rounded-2xl p-4 print:border print:border-gray-300">
            <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">{wetOnly}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Wet Only</div>
          </div>
          <div className="bg-baby-peach dark:bg-opacity-20 rounded-2xl p-4 print:border print:border-gray-300">
            <div className="text-3xl font-bold text-accent-600 dark:text-accent-400">{dirtyOnly}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Dirty Only</div>
          </div>
        </div>
      </section>

      {/* Change Type Breakdown */}
      <section>
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Change Type Distribution</h3>
        <div className="bg-white dark:bg-gray-700 rounded-2xl p-6 shadow-soft print:border print:border-gray-300">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-700 dark:text-gray-300">💧 Wet Only</span>
              <span className="font-bold text-gray-900 dark:text-gray-100">{wetOnly} ({Math.round(wetOnly / totalChanges * 100)}%)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700 dark:text-gray-300">💩 Dirty Only</span>
              <span className="font-bold text-gray-900 dark:text-gray-100">{dirtyOnly} ({Math.round(dirtyOnly / totalChanges * 100)}%)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700 dark:text-gray-300">💧💩 Both</span>
              <span className="font-bold text-gray-900 dark:text-gray-100">{both} ({Math.round(both / totalChanges * 100)}%)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Daily Breakdown */}
      <section className="print:break-before-page">
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Daily Breakdown</h3>
        <div className="space-y-4">
          {sortedDates.map(date => {
            const dayDiapers = dailyBreakdown[date]
            const dayWet = dayDiapers.filter(d => d.is_wet && !d.is_dirty).length
            const dayDirty = dayDiapers.filter(d => d.is_dirty && !d.is_wet).length
            const dayBoth = dayDiapers.filter(d => d.is_wet && d.is_dirty).length

            return (
              <div key={date} className="bg-white dark:bg-gray-700 rounded-2xl p-4 shadow-soft print:border print:border-gray-300">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-gray-100">
                      {format(parseISO(date), 'EEEE, MMMM d, yyyy')}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {dayDiapers.length} change{dayDiapers.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    {dayWet > 0 && <div className="text-gray-600 dark:text-gray-400">💧 {dayWet}</div>}
                    {dayDirty > 0 && <div className="text-gray-600 dark:text-gray-400">💩 {dayDirty}</div>}
                    {dayBoth > 0 && <div className="text-gray-600 dark:text-gray-400">💧💩 {dayBoth}</div>}
                  </div>
                </div>
                <div className="space-y-2">
                  {dayDiapers.map(diaper => {
                    let type = ''
                    if (diaper.is_wet && diaper.is_dirty) type = '💧💩 Both'
                    else if (diaper.is_wet) type = '💧 Wet'
                    else if (diaper.is_dirty) type = '💩 Dirty'

                    return (
                      <div key={diaper.id} className="text-sm flex justify-between border-t border-gray-100 dark:border-gray-600 pt-2">
                        <span className="text-gray-600 dark:text-gray-400">
                          {format(parseISO(diaper.changed_at), 'h:mm a')}
                        </span>
                        <span className="text-gray-900 dark:text-gray-100 font-medium">{type}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Insights */}
      <section>
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Insights</h3>
        <div className="bg-baby-yellow dark:bg-opacity-20 rounded-2xl p-6 print:border print:border-gray-300">
          <ul className="space-y-2 text-gray-700 dark:text-gray-300">
            <li>• Your baby averaged <strong>{avgPerDay} diaper changes per day</strong></li>
            <li>• Most common type: <strong>{wetOnly > dirtyOnly && wetOnly > both ? 'Wet only' : dirtyOnly > both ? 'Dirty only' : 'Both'}</strong></li>
            <li>• Total wet diapers: <strong>{wetOnly + both}</strong> ({Math.round((wetOnly + both) / totalChanges * 100)}%)</li>
            <li>• Total dirty diapers: <strong>{dirtyOnly + both}</strong> ({Math.round((dirtyOnly + both) / totalChanges * 100)}%)</li>
          </ul>
        </div>
      </section>
    </div>
  )
}
