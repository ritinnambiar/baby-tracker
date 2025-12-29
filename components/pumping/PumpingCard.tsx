import { PumpingLog } from '@/lib/types/pumping'
import { Card } from '@/components/ui/Card'
import { format } from 'date-fns'

export function PumpingCard({ pumping }: { pumping: PumpingLog }) {
  const formatDuration = (start: string, end: string | null): string => {
    if (!end) return 'In progress'
    const startTime = new Date(start).getTime()
    const endTime = new Date(end).getTime()
    const minutes = Math.floor((endTime - startTime) / 1000 / 60)
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
            <span className="text-2xl">🍼</span>
            <h3 className="text-lg font-semibold text-gray-800">Pumping Session</h3>
          </div>

          <div className="text-sm text-gray-600 space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">Started:</span>
              <span>{format(new Date(pumping.started_at), 'MMM d, yyyy h:mm a')}</span>
            </div>

            {pumping.ended_at && (
              <div className="flex items-center gap-2">
                <span className="font-medium">Duration:</span>
                <span>{formatDuration(pumping.started_at, pumping.ended_at)}</span>
              </div>
            )}

            {/* Amount Display */}
            <div className="grid grid-cols-2 gap-2 mt-2">
              {pumping.left_amount_ml !== null && (
                <div className="bg-baby-pink rounded-xl p-2 text-center">
                  <div className="text-xs text-gray-600">Left</div>
                  <div className="font-semibold text-primary-600">
                    {pumping.left_amount_ml} ml
                  </div>
                </div>
              )}
              {pumping.right_amount_ml !== null && (
                <div className="bg-baby-blue rounded-xl p-2 text-center">
                  <div className="text-xs text-gray-600">Right</div>
                  <div className="font-semibold text-accent-600">
                    {pumping.right_amount_ml} ml
                  </div>
                </div>
              )}
            </div>

            {/* Total Amount */}
            {pumping.total_amount_ml !== null && (
              <div className="mt-2 p-2 bg-baby-purple rounded-xl text-center">
                <span className="text-xs text-gray-600">Total: </span>
                <span className="text-lg font-bold text-primary-600">
                  {pumping.total_amount_ml} ml
                </span>
              </div>
            )}

            {pumping.notes && (
              <div className="mt-2 p-2 bg-gray-50 rounded-xl">
                <span className="text-xs font-medium text-gray-500">Note:</span>
                <p className="text-sm text-gray-700">{pumping.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
