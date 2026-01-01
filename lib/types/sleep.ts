export type SleepType = 'nap' | 'night'

export interface SleepLog {
  id: string
  baby_id: string
  user_id: string
  sleep_type: SleepType
  started_at: string
  ended_at: string | null
  duration_minutes: number | null
  notes: string | null
  photo_url: string | null
  created_at: string
  updated_at: string
}

export interface SleepTimerState {
  isActive: boolean
  sleepType: SleepType
  startedAt: string | null
  lastUpdated: number
}
