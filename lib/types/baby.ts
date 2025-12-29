export interface Baby {
  id: string
  user_id: string
  name: string
  date_of_birth: string
  gender: 'male' | 'female' | 'other' | null
  photo_url: string | null
  birth_weight: number | null
  birth_height: number | null
  birth_head_circumference: number | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface BabyFormData {
  name: string
  date_of_birth: string
  gender: 'male' | 'female' | 'other' | ''
  birth_weight: string
  birth_height: string
  birth_head_circumference: string
}
