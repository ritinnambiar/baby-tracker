'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

interface DailyNotesProps {
  babyId: string
  userId: string
}

interface DailyNote {
  id: string
  baby_id: string
  user_id: string
  note_date: string
  content: string
  tags: string[]
  created_at: string
  updated_at: string
}

const COMMON_TAGS = ['happy', 'fussy', 'milestone', 'sick', 'teething', 'playful', 'sleepy']

export function DailyNotes({ babyId, userId }: DailyNotesProps) {
  const supabase = createClient()
  const [note, setNote] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [existingNote, setExistingNote] = useState<DailyNote | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingFetch, setLoadingFetch] = useState(true)
  const today = format(new Date(), 'yyyy-MM-dd')

  // Fetch today's note
  useEffect(() => {
    const fetchTodayNote = async () => {
      try {
        const { data, error } = await supabase
          .from('daily_notes')
          .select('*')
          .eq('baby_id', babyId)
          .eq('note_date', today)
          .maybeSingle()

        if (error) throw error

        if (data) {
          setExistingNote(data)
          setNote(data.content)
          setSelectedTags(data.tags || [])
        }
      } catch (error) {
        console.error('Error fetching daily note:', error)
      } finally {
        setLoadingFetch(false)
      }
    }

    fetchTodayNote()
  }, [babyId, supabase, today])

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag))
    } else {
      setSelectedTags([...selectedTags, tag])
    }
  }

  const handleSave = async () => {
    if (!note.trim()) {
      toast.error('Please enter a note')
      return
    }

    setLoading(true)

    try {
      if (existingNote) {
        // Update existing note
        const { error } = await supabase
          .from('daily_notes')
          .update({
            content: note,
            tags: selectedTags,
          })
          .eq('id', existingNote.id)

        if (error) throw error
        toast.success('Note updated!')
      } else {
        // Create new note
        const { data, error } = await supabase
          .from('daily_notes')
          .insert({
            baby_id: babyId,
            user_id: userId,
            note_date: today,
            content: note,
            tags: selectedTags,
          })
          .select()
          .single()

        if (error) throw error
        setExistingNote(data)
        toast.success('Note saved!')
      }
    } catch (error) {
      console.error('Error saving note:', error)
      toast.error('Failed to save note')
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setNote('')
    setSelectedTags([])
  }

  if (loadingFetch) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-soft p-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500 dark:text-gray-400">Loading notes...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-soft p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">📝 Daily Notes</h2>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {format(new Date(), 'MMMM d, yyyy')}
        </div>
      </div>

      <div className="space-y-4">
        {/* Note Input */}
        <div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="How was today? Any milestones, observations, or notes..."
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 min-h-[120px] resize-y"
            maxLength={1000}
          />
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
            {note.length}/1000
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            Mood & Activity Tags
          </label>
          <div className="flex flex-wrap gap-2">
            {COMMON_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedTags.includes(tag)
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={handleSave}
            disabled={loading || !note.trim()}
            className="flex-1"
          >
            {loading ? 'Saving...' : existingNote ? 'Update Note' : 'Save Note'}
          </Button>
          <Button
            variant="outline"
            onClick={handleClear}
            disabled={loading}
          >
            Clear
          </Button>
        </div>

        {/* Last Updated Info */}
        {existingNote && (
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Last updated: {format(new Date(existingNote.updated_at), 'h:mm a')}
          </div>
        )}
      </div>
    </div>
  )
}
