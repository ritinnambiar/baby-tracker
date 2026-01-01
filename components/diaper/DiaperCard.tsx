import { DiaperChange } from '@/lib/types/diaper'
import { Card } from '@/components/ui/Card'
import { format } from 'date-fns'

export function DiaperCard({ diaper }: { diaper: DiaperChange }) {
  const getTypeDisplay = () => {
    if (diaper.is_wet && diaper.is_dirty) {
      return {
        icon: '💧💩',
        label: 'Wet & Dirty',
        bgColor: 'bg-baby-yellow',
      }
    } else if (diaper.is_wet) {
      return {
        icon: '💧',
        label: 'Wet',
        bgColor: 'bg-baby-blue',
      }
    } else {
      return {
        icon: '💩',
        label: 'Dirty',
        bgColor: 'bg-baby-peach',
      }
    }
  }

  const typeDisplay = getTypeDisplay()

  return (
    <Card className="hover:shadow-lg transition-all">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{typeDisplay.icon}</span>
            <h3 className="text-lg font-semibold text-gray-800">
              {typeDisplay.label}
            </h3>
          </div>

          <div className="text-sm text-gray-600 space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">Time:</span>
              <span>{format(new Date(diaper.changed_at), 'MMM d, yyyy h:mm a')}</span>
            </div>

            {/* Type badges */}
            <div className="flex gap-2 mt-2">
              {diaper.is_wet && (
                <span className="px-3 py-1 bg-baby-blue rounded-full text-xs font-semibold text-gray-700">
                  💧 Wet
                </span>
              )}
              {diaper.is_dirty && (
                <span className="px-3 py-1 bg-baby-peach rounded-full text-xs font-semibold text-gray-700">
                  💩 Dirty
                </span>
              )}
            </div>

            {diaper.notes && (
              <div className="mt-2 p-2 bg-gray-50 rounded-xl">
                <span className="text-xs font-medium text-gray-500">Note:</span>
                <p className="text-sm text-gray-700">{diaper.notes}</p>
              </div>
            )}

            {diaper.photo_url && (
              <div className="mt-2">
                <img
                  src={diaper.photo_url}
                  alt="Diaper change photo"
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
