import { FeedingLog } from '@/lib/types/feeding'
import { Card } from '@/components/ui/Card'
import { format } from 'date-fns'

export function FeedingCard({ feeding }: { feeding: FeedingLog }) {
  const formatDuration = (minutes: number | null): string => {
    if (!minutes) return '0m'
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  return (
    <Card className="hover:shadow-lg transition-all">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">
              {feeding.feeding_type === 'bottle' ? '🍼' : '🤱'}
            </span>
            <h3 className="text-lg font-semibold text-gray-800">
              {feeding.feeding_type === 'bottle' ? 'Bottle' : 'Nursing'}
            </h3>
          </div>

          <div className="text-sm text-gray-600 space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">Time:</span>
              <span>{format(new Date(feeding.started_at), 'MMM d, yyyy h:mm a')}</span>
            </div>

            {feeding.feeding_type === 'bottle' && feeding.amount_ml && (
              <div className="flex items-center gap-2">
                <span className="font-medium">Amount:</span>
                <span className="text-primary-600 font-semibold">
                  {feeding.amount_ml} ml
                </span>
              </div>
            )}

            {feeding.feeding_type === 'breast' && (
              <>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Side:</span>
                  <span className="capitalize">{feeding.breast_side}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {(feeding.left_duration_minutes ?? 0) > 0 && (
                    <div className="bg-baby-pink rounded-xl p-2 text-center">
                      <div className="text-xs text-gray-600">Left</div>
                      <div className="font-semibold text-primary-600">
                        {formatDuration(feeding.left_duration_minutes)}
                      </div>
                    </div>
                  )}
                  {(feeding.right_duration_minutes ?? 0) > 0 && (
                    <div className="bg-baby-blue rounded-xl p-2 text-center">
                      <div className="text-xs text-gray-600">Right</div>
                      <div className="font-semibold text-accent-600">
                        {formatDuration(feeding.right_duration_minutes)}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {feeding.notes && (
              <div className="mt-2 p-2 bg-gray-50 rounded-xl">
                <span className="text-xs font-medium text-gray-500">Note:</span>
                <p className="text-sm text-gray-700">{feeding.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
