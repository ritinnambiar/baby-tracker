export type FeedingType = 'bottle' | 'breast'
export type BreastSide = 'left' | 'right' | 'both'

export interface FeedingLog {
  id: string
  baby_id: string
  user_id: string
  feeding_type: FeedingType
  amount_ml: number | null
  breast_side: BreastSide | null
  left_duration_minutes: number | null
  right_duration_minutes: number | null
  started_at: string
  ended_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface FeedingFormData {
  feeding_type: FeedingType
  amount_ml: string
  breast_side: BreastSide | ''
  left_duration_minutes: number
  right_duration_minutes: number
  started_at: string
  notes: string
}

export interface TimerState {
  isActive: boolean
  activeSide: 'left' | 'right' | null
  leftDuration: number // seconds
  rightDuration: number // seconds
  startedAt: string | null
  lastUpdated: number // timestamp for calculating elapsed time
}
