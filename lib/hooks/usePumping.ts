'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PumpingLog } from '@/lib/types/pumping'

export function usePumping(babyId: string | null) {
  const [pumpingSessions, setPumpingSessions] = useState<PumpingLog[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchPumpingSessions = async () => {
    if (!babyId) {
      setPumpingSessions([])
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('pumping_logs')
        .select('*')
        .eq('baby_id', babyId)
        .order('started_at', { ascending: false })

      if (error) throw error

      setPumpingSessions(data || [])
    } catch (error) {
      console.error('Error fetching pumping sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPumpingSessions()
  }, [babyId])

  const refreshPumpingSessions = () => {
    fetchPumpingSessions()
  }

  return { pumpingSessions, loading, refreshPumpingSessions }
}
