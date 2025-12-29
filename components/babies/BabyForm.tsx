'use client'

import { useState, FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth/AuthProvider'
import { useActiveBaby } from '@/lib/hooks/useActiveBaby'
import { Baby, BabyFormData } from '@/lib/types/baby'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface BabyFormProps {
  baby?: Baby | null
  onSuccess?: () => void
  onCancel?: () => void
  redirectToDashboard?: boolean
}

export function BabyForm({ baby, onSuccess, onCancel, redirectToDashboard = false }: BabyFormProps) {
  const { user } = useAuth()
  const { refreshBabies } = useActiveBaby()
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState<BabyFormData>({
    name: baby?.name || '',
    date_of_birth: baby?.date_of_birth || '',
    gender: baby?.gender || '',
    birth_weight: baby?.birth_weight?.toString() || '',
    birth_height: baby?.birth_height?.toString() || '',
    birth_head_circumference: baby?.birth_head_circumference?.toString() || '',
  })
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(baby?.photo_url || null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Photo must be less than 5MB')
        return
      }
      setPhotoFile(file)
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadPhoto = async (): Promise<string | null> => {
    if (!photoFile || !user) return null

    setUploadingPhoto(true)
    try {
      const fileExt = photoFile.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `baby-photos/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('baby-photos')
        .upload(filePath, photoFile)

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('baby-photos')
        .getPublicUrl(filePath)

      return data.publicUrl
    } catch (error: any) {
      toast.error('Failed to upload photo')
      console.error('Photo upload error:', error)
      return null
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)

    try {
      // Upload photo if one was selected
      let photoUrl = baby?.photo_url || null
      if (photoFile) {
        const uploadedUrl = await uploadPhoto()
        if (uploadedUrl) {
          photoUrl = uploadedUrl
        }
      }

      const dataToSubmit = {
        user_id: user.id,
        name: formData.name,
        date_of_birth: formData.date_of_birth,
        gender: formData.gender || null,
        photo_url: photoUrl,
        birth_weight: formData.birth_weight ? parseFloat(formData.birth_weight) : null,
        birth_height: formData.birth_height ? parseFloat(formData.birth_height) : null,
        birth_head_circumference: formData.birth_head_circumference
          ? parseFloat(formData.birth_head_circumference)
          : null,
      }

      if (baby) {
        // Update existing baby
        const { error } = await supabase
          .from('babies')
          .update(dataToSubmit)
          .eq('id', baby.id)

        if (error) throw error
        toast.success('Baby profile updated!')
      } else {
        // Create new baby
        const { error } = await supabase.from('babies').insert(dataToSubmit)

        if (error) throw error
        toast.success('Baby profile created!')
      }

      await refreshBabies()

      if (redirectToDashboard && !baby) {
        // Redirect to dashboard after adding first baby
        router.push('/dashboard')
      } else {
        onSuccess?.()
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to save baby profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Baby's Name"
        type="text"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder="Enter baby's name"
        required
      />

      {/* Photo Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Baby's Photo (Optional)
        </label>
        <div className="flex items-center gap-4">
          {photoPreview && (
            <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-primary-200">
              <img
                src={photoPreview}
                alt="Baby photo preview"
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="flex-1">
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
              id="photo-upload"
            />
            <label
              htmlFor="photo-upload"
              className="inline-block px-4 py-2 bg-white border-2 border-primary-500 text-primary-500 rounded-2xl cursor-pointer hover:bg-primary-50 transition-all"
            >
              {photoPreview ? 'Change Photo' : 'Upload Photo'}
            </label>
            <p className="text-xs text-gray-500 mt-1">Max 5MB (JPG, PNG, GIF)</p>
          </div>
        </div>
      </div>

      <Input
        label="Date of Birth"
        type="date"
        value={formData.date_of_birth}
        onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
        required
        max={new Date().toISOString().split('T')[0]}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Gender (Optional)
        </label>
        <select
          value={formData.gender}
          onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
          className="w-full px-4 py-2.5 rounded-2xl border-2 border-gray-300 bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
        >
          <option value="">Select gender</option>
          <option value="male">Boy</option>
          <option value="female">Girl</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          label="Birth Weight (kg)"
          type="number"
          step="0.01"
          value={formData.birth_weight}
          onChange={(e) => setFormData({ ...formData, birth_weight: e.target.value })}
          placeholder="3.5"
        />

        <Input
          label="Birth Height (cm)"
          type="number"
          step="0.1"
          value={formData.birth_height}
          onChange={(e) => setFormData({ ...formData, birth_height: e.target.value })}
          placeholder="50"
        />

        <Input
          label="Head Circumference (cm)"
          type="number"
          step="0.1"
          value={formData.birth_head_circumference}
          onChange={(e) => setFormData({ ...formData, birth_head_circumference: e.target.value })}
          placeholder="35"
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="submit" className="flex-1" isLoading={loading}>
          {baby ? 'Update Baby' : 'Add Baby'}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}
