export interface DiaperChange {
  id: string
  baby_id: string
  user_id: string
  changed_at: string
  is_wet: boolean
  is_dirty: boolean
  notes: string | null
  created_at: string
  updated_at: string
}
