'use client'

import { useEffect, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'

interface QuickStatsProps {
  lastFeeding?: { started_at: string; feeding_type: string }
  lastSleep?: { started_at: string; ended_at: string | null }
  lastDiaper?: { changed_at: string }
  lastPumping?: { started_at: string }
}

export function QuickStats({ lastFeeding, lastSleep, lastDiaper, lastPumping }: QuickStatsProps) {
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update time every minute for live countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // Update every minute

    return () => clearInterval(timer)
  }, [])

  const getTimeAgo = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
    } catch {
      return 'Unknown'
    }
  }

  const getTimeSince = (timestamp: string): number => {
    try {
      const diff = currentTime.getTime() - new Date(timestamp).getTime()
      return Math.floor(diff / (1000 * 60)) // minutes
    } catch {
      return 0
    }
  }

  const getAlertLevel = (minutes: number, type: 'feeding' | 'diaper' | 'sleep'): string => {
    if (type === 'feeding') {
      if (minutes > 240) return 'text-red-500 dark:text-red-400' // > 4 hours
      if (minutes > 180) return 'text-yellow-500 dark:text-yellow-400' // > 3 hours
      return 'text-green-500 dark:text-green-400'
    }
    if (type === 'diaper') {
      if (minutes > 180) return 'text-red-500 dark:text-red-400' // > 3 hours
      if (minutes > 120) return 'text-yellow-500 dark:text-yellow-400' // > 2 hours
      return 'text-green-500 dark:text-green-400'
    }
    if (type === 'sleep') {
      if (minutes > 180) return 'text-yellow-500 dark:text-yellow-400' // Awake > 3 hours
      return 'text-blue-500 dark:text-blue-400'
    }
    return 'text-gray-600 dark:text-gray-400'
  }

  const getAwakeTime = (): { minutes: number; text: string } | null => {
    if (!lastSleep) return null

    if (lastSleep.ended_at) {
      // Baby is awake
      const awakeMinutes = getTimeSince(lastSleep.ended_at)
      return {
        minutes: awakeMinutes,
        text: `Awake for ${Math.floor(awakeMinutes / 60)}h ${awakeMinutes % 60}m`
      }
    } else {
      // Baby is sleeping
      return {
        minutes: 0,
        text: 'Currently sleeping 😴'
      }
    }
  }

  const feedingMinutes = lastFeeding ? getTimeSince(lastFeeding.started_at) : 0
  const diaperMinutes = lastDiaper ? getTimeSince(lastDiaper.changed_at) : 0
  const awakeInfo = getAwakeTime()

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-soft p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">⚡ Quick Stats</h2>
        <div className="text-xs text-gray-500 dark:text-gray-400">Live updates</div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Last Feeding */}
        <div className="bg-baby-pink dark:bg-opacity-20 rounded-xl p-4">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Last Feeding</div>
          {lastFeeding ? (
            <>
              <div className={`text-2xl font-bold ${getAlertLevel(feedingMinutes, 'feeding')}`}>
                {getTimeAgo(lastFeeding.started_at).replace('about ', '')}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {lastFeeding.feeding_type === 'bottle' ? '🍼 Bottle' : '🤱 Breast'}
              </div>
            </>
          ) : (
            <div className="text-sm text-gray-500 dark:text-gray-400">No data yet</div>
          )}
        </div>

        {/* Awake Time */}
        <div className="bg-baby-blue dark:bg-opacity-20 rounded-xl p-4">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Sleep Status</div>
          {awakeInfo ? (
            <>
              <div className={`text-2xl font-bold ${awakeInfo.minutes === 0 ? 'text-purple-500 dark:text-purple-400' : getAlertLevel(awakeInfo.minutes, 'sleep')}`}>
                {awakeInfo.minutes === 0 ? '😴' : `${Math.floor(awakeInfo.minutes / 60)}h ${awakeInfo.minutes % 60}m`}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {awakeInfo.text.replace('Awake for ', '')}
              </div>
            </>
          ) : (
            <div className="text-sm text-gray-500 dark:text-gray-400">No data yet</div>
          )}
        </div>

        {/* Last Diaper */}
        <div className="bg-baby-yellow dark:bg-opacity-20 rounded-xl p-4">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Last Diaper</div>
          {lastDiaper ? (
            <>
              <div className={`text-2xl font-bold ${getAlertLevel(diaperMinutes, 'diaper')}`}>
                {getTimeAgo(lastDiaper.changed_at).replace('about ', '')}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Changed
              </div>
            </>
          ) : (
            <div className="text-sm text-gray-500 dark:text-gray-400">No data yet</div>
          )}
        </div>

        {/* Last Pumping */}
        <div className="bg-baby-purple dark:bg-opacity-20 rounded-xl p-4">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Last Pumping</div>
          {lastPumping ? (
            <>
              <div className="text-2xl font-bold text-purple-500 dark:text-purple-400">
                {getTimeAgo(lastPumping.started_at).replace('about ', '')}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Session
              </div>
            </>
          ) : (
            <div className="text-sm text-gray-500 dark:text-gray-400">No data yet</div>
          )}
        </div>
      </div>

      {/* Alert Messages */}
      <div className="mt-4 space-y-2">
        {feedingMinutes > 240 && (
          <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
            ⚠️ It's been over 4 hours since last feeding
          </div>
        )}
        {diaperMinutes > 180 && (
          <div className="text-sm text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
            ⏰ Diaper change may be needed (3+ hours)
          </div>
        )}
        {awakeInfo && awakeInfo.minutes > 180 && (
          <div className="text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
            💤 Baby has been awake for over 3 hours - nap time soon?
          </div>
        )}
      </div>
    </div>
  )
}
