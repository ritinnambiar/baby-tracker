import { SleepLog } from '@/lib/types/sleep'
import { Card } from '@/components/ui/Card'
import { format } from 'date-fns'

export function SleepCard({ sleep }: { sleep: SleepLog }) {
  const formatDuration = (minutes: number | null): string => {
    if (!minutes) return '0m'
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (mins === 0) return `${hours}h`
    return `${hours}h ${mins}m`
  }

  const isActive = !sleep.ended_at

  return (
    <Card className={`hover:shadow-lg transition-all ${isActive ? 'ring-2 ring-primary-500' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">
              {sleep.sleep_type === 'nap' ? '😴' : '🌙'}
            </span>
            <h3 className="text-lg font-semibold text-gray-800">
              {sleep.sleep_type === 'nap' ? 'Nap' : 'Night Sleep'}
            </h3>
            {isActive && (
              <span className="px-2 py-1 text-xs font-semibold bg-primary-500 text-white rounded-full animate-pulse">
                Active
              </span>
            )}
          </div>

          <div className="text-sm text-gray-600 space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">Started:</span>
              <span>{format(new Date(sleep.started_at), 'MMM d, yyyy h:mm a')}</span>
            </div>

            {sleep.ended_at && (
              <div className="flex items-center gap-2">
                <span className="font-medium">Ended:</span>
                <span>{format(new Date(sleep.ended_at), 'MMM d, yyyy h:mm a')}</span>
              </div>
            )}

            {sleep.duration_minutes !== null && (
              <div className="flex items-center gap-2">
                <span className="font-medium">Duration:</span>
                <span className="text-primary-600 font-semibold text-lg">
                  {formatDuration(sleep.duration_minutes)}
                </span>
              </div>
            )}

            {sleep.notes && (
              <div className="mt-2 p-2 bg-gray-50 rounded-xl">
                <span className="text-xs font-medium text-gray-500">Note:</span>
                <p className="text-sm text-gray-700">{sleep.notes}</p>
              </div>
            )}

            {sleep.photo_url && (
              <div className="mt-2">
                <img
                  src={sleep.photo_url}
                  alt="Sleep photo"
                  className="w-full h-48 object-cover rounded-xl border-2 border-gray-200"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
