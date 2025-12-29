export type CaregiverRole = 'owner' | 'caregiver'

export interface BabyCaregiver {
  id: string
  baby_id: string
  user_id: string
  role: CaregiverRole
  added_at: string
  added_by: string | null
  created_at: string
  updated_at: string
}

export interface CaregiverWithProfile extends BabyCaregiver {
  profile: {
    email: string
    full_name: string | null
  }
}
