'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from './Button'
import { LoadingSpinner } from './LoadingSpinner'
import toast from 'react-hot-toast'
import { Camera, X } from 'lucide-react'

interface ImageUploadProps {
  onUploadComplete: (url: string) => void
  currentImageUrl?: string | null
  onRemove?: () => void
  label?: string
  userId: string
}

export function ImageUpload({
  onUploadComplete,
  currentImageUrl,
  onRemove,
  label = 'Add Photo',
  userId,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0]
      if (!file) return

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file')
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB')
        return
      }

      setUploading(true)

      // Create unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}/${Date.now()}.${fileExt}`

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('baby-photos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (error) throw error

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('baby-photos').getPublicUrl(data.path)

      setPreviewUrl(publicUrl)
      onUploadComplete(publicUrl)
      toast.success('Photo uploaded!')
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload photo')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemove = () => {
    setPreviewUrl(null)
    if (onRemove) onRemove()
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />

      {previewUrl ? (
        <div className="relative">
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full h-48 object-cover rounded-xl border-2 border-gray-200 dark:border-gray-700"
          />
          <button
            onClick={handleRemove}
            className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-colors"
            type="button"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          type="button"
          className="w-full h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {uploading ? (
            <LoadingSpinner size="sm" text="Uploading..." />
          ) : (
            <>
              <Camera className="w-8 h-8 text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
            </>
          )}
        </button>
      )}
    </div>
  )
}
