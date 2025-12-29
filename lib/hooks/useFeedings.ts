import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FeedingLog } from '@/lib/types/feeding'

export function useFeedings(babyId: string | null) {
  const [feedings, setFeedings] = useState<FeedingLog[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchFeedings = async () => {
    if (!babyId) {
      setFeedings([])
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('feeding_logs')
        .select('*')
        .eq('baby_id', babyId)
        .order('started_at', { ascending: false })
        .limit(50)

      if (error) throw error

      setFeedings(data || [])
    } catch (error) {
      console.error('Error fetching feedings:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFeedings()
  }, [babyId])

  const refreshFeedings = () => {
    fetchFeedings()
  }

  return { feedings, loading, refreshFeedings }
}
