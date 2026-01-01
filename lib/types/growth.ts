export interface GrowthMeasurement {
  id: string
  baby_id: string
  user_id: string
  measured_at: string
  weight_kg: number | null
  height_cm: number | null
  head_circumference_cm: number | null
  notes: string | null
  photo_url: string | null
  created_at: string
  updated_at: string
}

export type MeasurementType = 'weight' | 'height' | 'head'
