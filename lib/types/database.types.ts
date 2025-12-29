export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      babies: {
        Row: {
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
        Insert: {
          id?: string
          user_id: string
          name: string
          date_of_birth: string
          gender?: 'male' | 'female' | 'other' | null
          photo_url?: string | null
          birth_weight?: number | null
          birth_height?: number | null
          birth_head_circumference?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          date_of_birth?: string
          gender?: 'male' | 'female' | 'other' | null
          photo_url?: string | null
          birth_weight?: number | null
          birth_height?: number | null
          birth_head_circumference?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
