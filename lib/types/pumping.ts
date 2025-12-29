export interface PumpingLog {
  id: string
  baby_id: string
  user_id: string
  started_at: string
  ended_at: string | null
  left_amount_ml: number | null
  right_amount_ml: number | null
  total_amount_ml: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface PumpingTimerState {
  isActive: boolean
  activeSide: 'left' | 'right' | null
  leftAmount: number
  rightAmount: number
  startedAt: string | null
  lastUpdated: number
}
