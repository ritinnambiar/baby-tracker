'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { DiaperChange } from '@/lib/types/diaper'

export function useDiapers(babyId: string | null) {
  const [diapers, setDiapers] = useState<DiaperChange[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchDiapers = async () => {
    if (!babyId) {
      setDiapers([])
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('diaper_changes')
        .select('*')
        .eq('baby_id', babyId)
        .order('changed_at', { ascending: false })

      if (error) throw error

      setDiapers(data || [])
    } catch (error) {
      console.error('Error fetching diaper changes:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDiapers()
  }, [babyId])

  const refreshDiapers = () => {
    fetchDiapers()
  }

  return { diapers, loading, refreshDiapers }
}
