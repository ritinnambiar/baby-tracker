'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SleepLog } from '@/lib/types/sleep'

export function useSleep(babyId: string | null) {
  const [sleeps, setSleeps] = useState<SleepLog[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchSleeps = async () => {
    if (!babyId) {
      setSleeps([])
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('sleep_logs')
        .select('*')
        .eq('baby_id', babyId)
        .order('started_at', { ascending: false })

      if (error) throw error

      setSleeps(data || [])
    } catch (error) {
      console.error('Error fetching sleep logs:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSleeps()
  }, [babyId])

  const refreshSleeps = () => {
    fetchSleeps()
  }

  return { sleeps, loading, refreshSleeps }
}
