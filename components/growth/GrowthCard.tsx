import { GrowthMeasurement } from '@/lib/types/growth'
import { Card } from '@/components/ui/Card'
import { format } from 'date-fns'

export function GrowthCard({ measurement }: { measurement: GrowthMeasurement }) {
  return (
    <Card className="hover:shadow-lg transition-all">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">📊</span>
            <h3 className="text-lg font-semibold text-gray-800">Growth Measurement</h3>
          </div>

          <div className="text-sm text-gray-600 space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">Measured:</span>
              <span>{format(new Date(measurement.measured_at), 'MMM d, yyyy h:mm a')}</span>
            </div>

            {/* Measurements Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-3">
              {measurement.weight_kg !== null && (
                <div className="bg-baby-pink rounded-xl p-3 text-center">
                  <div className="text-xs text-gray-600 mb-1">Weight</div>
                  <div className="text-lg font-semibold text-primary-600">
                    {measurement.weight_kg} kg
                  </div>
                </div>
              )}

              {measurement.height_cm !== null && (
                <div className="bg-baby-blue rounded-xl p-3 text-center">
                  <div className="text-xs text-gray-600 mb-1">Height</div>
                  <div className="text-lg font-semibold text-accent-600">
                    {measurement.height_cm} cm
                  </div>
                </div>
              )}

              {measurement.head_circumference_cm !== null && (
                <div className="bg-baby-green rounded-xl p-3 text-center">
                  <div className="text-xs text-gray-600 mb-1">Head</div>
                  <div className="text-lg font-semibold text-green-600">
                    {measurement.head_circumference_cm} cm
                  </div>
                </div>
              )}
            </div>

            {measurement.notes && (
              <div className="mt-2 p-2 bg-gray-50 rounded-xl">
                <span className="text-xs font-medium text-gray-500">Note:</span>
                <p className="text-sm text-gray-700">{measurement.notes}</p>
              </div>
            )}

            {measurement.photo_url && (
              <div className="mt-2">
                <img
                  src={measurement.photo_url}
                  alt="Growth measurement photo"
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
