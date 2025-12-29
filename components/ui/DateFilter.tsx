'use client'

import { useState } from 'react'
import { Button } from './Button'
import { startOfDay, endOfDay, startOfWeek, endOfWeek, subDays, format } from 'date-fns'

export type DateRange = {
  start: Date
  end: Date
  label: string
}

interface DateFilterProps {
  onFilterChange: (range: DateRange) => void
  initialFilter?: 'today' | 'week' | 'month' | 'all'
}

export function DateFilter({ onFilterChange, initialFilter = 'all' }: DateFilterProps) {
  const [activeFilter, setActiveFilter] = useState<string>(initialFilter)
  const [showCustom, setShowCustom] = useState(false)
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  const handleFilterClick = (filter: string) => {
    setActiveFilter(filter)
    setShowCustom(false)

    const now = new Date()
    let range: DateRange

    switch (filter) {
      case 'today':
        range = {
          start: startOfDay(now),
          end: endOfDay(now),
          label: 'Today',
        }
        break
      case 'week':
        range = {
          start: startOfWeek(now, { weekStartsOn: 0 }),
          end: endOfWeek(now, { weekStartsOn: 0 }),
          label: 'This Week',
        }
        break
      case 'month':
        range = {
          start: startOfDay(subDays(now, 30)),
          end: endOfDay(now),
          label: 'Last 30 Days',
        }
        break
      case 'all':
      default:
        range = {
          start: new Date(2000, 0, 1),
          end: endOfDay(now),
          label: 'All Time',
        }
        break
    }

    onFilterChange(range)
  }

  const handleCustomFilter = () => {
    if (!customStart || !customEnd) return

    const start = startOfDay(new Date(customStart))
    const end = endOfDay(new Date(customEnd))

    if (start > end) return

    const range: DateRange = {
      start,
      end,
      label: `${format(start, 'MMM d')} - ${format(end, 'MMM d')}`,
    }

    setActiveFilter('custom')
    onFilterChange(range)
  }

  return (
    <div className="bg-white rounded-2xl p-4 shadow-soft">
      <div className="flex flex-wrap gap-2 mb-3">
        <Button
          size="sm"
          variant={activeFilter === 'today' ? 'primary' : 'outline'}
          onClick={() => handleFilterClick('today')}
        >
          Today
        </Button>
        <Button
          size="sm"
          variant={activeFilter === 'week' ? 'primary' : 'outline'}
          onClick={() => handleFilterClick('week')}
        >
          This Week
        </Button>
        <Button
          size="sm"
          variant={activeFilter === 'month' ? 'primary' : 'outline'}
          onClick={() => handleFilterClick('month')}
        >
          Last 30 Days
        </Button>
        <Button
          size="sm"
          variant={activeFilter === 'all' ? 'primary' : 'outline'}
          onClick={() => handleFilterClick('all')}
        >
          All Time
        </Button>
        <Button
          size="sm"
          variant={activeFilter === 'custom' ? 'primary' : 'outline'}
          onClick={() => setShowCustom(!showCustom)}
        >
          Custom
        </Button>
      </div>

      {showCustom && (
        <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-gray-200">
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className="flex-1 px-3 py-2 rounded-xl border-2 border-gray-300 bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
          />
          <span className="self-center text-gray-500">to</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className="flex-1 px-3 py-2 rounded-xl border-2 border-gray-300 bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
          />
          <Button size="sm" onClick={handleCustomFilter} disabled={!customStart || !customEnd}>
            Apply
          </Button>
        </div>
      )}
    </div>
  )
}
