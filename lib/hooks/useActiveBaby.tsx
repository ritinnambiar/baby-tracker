'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth/AuthProvider'
import { Baby } from '@/lib/types/baby'

interface ActiveBabyContextType {
  activeBaby: Baby | null
  babies: Baby[]
  setActiveBaby: (baby: Baby | null) => void
  refreshBabies: () => Promise<void>
  loading: boolean
}

const ActiveBabyContext = createContext<ActiveBabyContextType | undefined>(undefined)

export function ActiveBabyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const supabase = createClient()
  const [activeBaby, setActiveBabyState] = useState<Baby | null>(null)
  const [babies, setBabies] = useState<Baby[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch all babies for the user (including shared babies)
  const fetchBabies = async () => {
    if (!user) {
      setBabies([])
      setActiveBabyState(null)
      setLoading(false)
      return
    }

    try {
      // Get all baby IDs the user has access to (owner or caregiver)
      const { data: caregiverData, error: caregiverError } = await supabase
        .from('baby_caregivers')
        .select('baby_id')
        .eq('user_id', user.id)

      if (caregiverError) {
        console.error('Error fetching caregiver data:', caregiverError)
        throw caregiverError
      }

      const babyIds = caregiverData?.map((c) => c.baby_id) || []

      console.log('Baby IDs user has access to:', babyIds)

      if (babyIds.length === 0) {
        console.log('No babies found for user')
        setBabies([])
        setActiveBabyState(null)
        setLoading(false)
        return
      }

      // Fetch full baby details for all accessible babies
      const { data, error } = await supabase
        .from('babies')
        .select('*')
        .in('id', babyIds)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching baby details:', error)
        throw error
      }

      console.log('Fetched babies:', data)
      setBabies(data || [])

      // Set active baby from localStorage or first baby
      if (data && data.length > 0) {
        const savedBabyId = localStorage.getItem('activeBabyId')
        const savedBaby = data.find((b) => b.id === savedBabyId)
        setActiveBabyState(savedBaby || data[0])
      } else {
        setActiveBabyState(null)
      }
    } catch (error) {
      console.error('Error fetching babies:', error)
    } finally {
      setLoading(false)
    }
  }

  // Set active baby and save to localStorage
  const setActiveBaby = (baby: Baby | null) => {
    setActiveBabyState(baby)
    if (baby) {
      localStorage.setItem('activeBabyId', baby.id)
    } else {
      localStorage.removeItem('activeBabyId')
    }
  }

  // Refresh babies list
  const refreshBabies = async () => {
    await fetchBabies()
  }

  useEffect(() => {
    fetchBabies()
  }, [user])

  return (
    <ActiveBabyContext.Provider
      value={{
        activeBaby,
        babies,
        setActiveBaby,
        refreshBabies,
        loading,
      }}
    >
      {children}
    </ActiveBabyContext.Provider>
  )
}

export function useActiveBaby() {
  const context = useContext(ActiveBabyContext)
  if (context === undefined) {
    throw new Error('useActiveBaby must be used within an ActiveBabyProvider')
  }
  return context
}
