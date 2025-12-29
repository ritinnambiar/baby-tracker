'use client'

import { GrowthMeasurement, MeasurementType } from '@/lib/types/growth'
import { Card } from '@/components/ui/Card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'

interface GrowthChartProps {
  measurements: GrowthMeasurement[]
  type: MeasurementType
}

export function GrowthChart({ measurements, type }: GrowthChartProps) {
  // Filter and prepare data for the chart
  const chartData = measurements
    .filter((m) => {
      if (type === 'weight') return m.weight_kg !== null
      if (type === 'height') return m.height_cm !== null
      if (type === 'head') return m.head_circumference_cm !== null
      return false
    })
    .sort((a, b) => new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime())
    .map((m) => ({
      date: format(new Date(m.measured_at), 'MMM d'),
      fullDate: format(new Date(m.measured_at), 'MMM d, yyyy'),
      value:
        type === 'weight'
          ? m.weight_kg
          : type === 'height'
          ? m.height_cm
          : m.head_circumference_cm,
    }))

  if (chartData.length === 0) {
    return null
  }

  const config = {
    weight: {
      title: 'Weight',
      unit: 'kg',
      color: '#FF6B8A',
      bgColor: 'bg-baby-pink',
    },
    height: {
      title: 'Height',
      unit: 'cm',
      color: '#0074FF',
      bgColor: 'bg-baby-blue',
    },
    head: {
      title: 'Head Circumference',
      unit: 'cm',
      color: '#10B981',
      bgColor: 'bg-baby-green',
    },
  }

  const currentConfig = config[type]

  return (
    <Card className={`${currentConfig.bgColor} bg-opacity-20`}>
      <h3 className="text-xl font-bold text-gray-800 mb-4">{currentConfig.title} Progress</h3>

      <div className="bg-white rounded-2xl p-4">
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              label={{ value: currentConfig.unit, angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                padding: '8px 12px',
              }}
              labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
              formatter={(value: number) => [`${value} ${currentConfig.unit}`, currentConfig.title]}
              labelFormatter={(label) => {
                const item = chartData.find((d) => d.date === label)
                return item?.fullDate || label
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={currentConfig.color}
              strokeWidth={3}
              dot={{ fill: currentConfig.color, r: 5 }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-2 mt-4">
        <div className="bg-white rounded-xl p-3 text-center">
          <div className="text-xs text-gray-600">First</div>
          <div className="text-sm font-semibold text-gray-800">
            {chartData[0]?.value} {currentConfig.unit}
          </div>
        </div>
        <div className="bg-white rounded-xl p-3 text-center">
          <div className="text-xs text-gray-600">Latest</div>
          <div className="text-sm font-semibold text-primary-600">
            {chartData[chartData.length - 1]?.value} {currentConfig.unit}
          </div>
        </div>
        <div className="bg-white rounded-xl p-3 text-center">
          <div className="text-xs text-gray-600">Change</div>
          <div className="text-sm font-semibold text-green-600">
            +{((chartData[chartData.length - 1]?.value || 0) - (chartData[0]?.value || 0)).toFixed(2)} {currentConfig.unit}
          </div>
        </div>
      </div>
    </Card>
  )
}
