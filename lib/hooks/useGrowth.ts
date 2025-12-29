'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { GrowthMeasurement } from '@/lib/types/growth'

export function useGrowth(babyId: string | null) {
  const [measurements, setMeasurements] = useState<GrowthMeasurement[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchMeasurements = async () => {
    if (!babyId) {
      setMeasurements([])
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('growth_measurements')
        .select('*')
        .eq('baby_id', babyId)
        .order('measured_at', { ascending: false })

      if (error) throw error

      setMeasurements(data || [])
    } catch (error) {
      console.error('Error fetching growth measurements:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMeasurements()
  }, [babyId])

  const refreshMeasurements = () => {
    fetchMeasurements()
  }

  return { measurements, loading, refreshMeasurements }
}
