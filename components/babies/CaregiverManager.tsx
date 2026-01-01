'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth/AuthProvider'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { CaregiverWithProfile } from '@/lib/types/caregiver'
import toast from 'react-hot-toast'

interface CaregiverManagerProps {
  babyId: string
  babyName: string
}

interface Invitation {
  id: string
  invited_email: string
  status: string
  token: string
  created_at: string
}

export function CaregiverManager({ babyId, babyName }: CaregiverManagerProps) {
  const { user } = useAuth()
  const supabase = createClient()
  const [caregivers, setCaregivers] = useState<CaregiverWithProfile[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [addingCaregiver, setAddingCaregiver] = useState(false)
  const [email, setEmail] = useState('')
  const [isOwner, setIsOwner] = useState(false)

  useEffect(() => {
    fetchData()
  }, [babyId])

  const fetchData = async () => {
    await Promise.all([fetchCaregivers(), fetchInvitations()])
  }

  const fetchCaregivers = async () => {
    try {
      const { data, error } = await supabase
        .from('baby_caregivers')
        .select(`
          *,
          profile:user_id (
            email,
            full_name
          )
        `)
        .eq('baby_id', babyId)
        .order('role', { ascending: false }) // owners first

      if (error) throw error

      setCaregivers(data as any || [])

      // Check if current user is owner
      const userCaregiver = data?.find((c) => c.user_id === user?.id)
      setIsOwner(userCaregiver?.role === 'owner')
    } catch (error) {
      console.error('Error fetching caregivers:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchInvitations = async () => {
    try {
      const { data, error } = await supabase
        .from('baby_invitations')
        .select('*')
        .eq('baby_id', babyId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) throw error

      setInvitations(data || [])
    } catch (error) {
      console.error('Error fetching invitations:', error)
    }
  }

  const handleAddCaregiver = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email')
      return
    }

    setAddingCaregiver(true)

    try {
      const cleanEmail = email.toLowerCase().trim()

      // Check if user exists
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', cleanEmail)
        .maybeSingle()

      if (profiles) {
        // User exists - add directly as caregiver
        const existingCaregiver = caregivers.find((c) => c.user_id === profiles.id)
        if (existingCaregiver) {
          toast.error('This user is already a caregiver for this baby')
          setAddingCaregiver(false)
          return
        }

        const { error } = await supabase.from('baby_caregivers').insert({
          baby_id: babyId,
          user_id: profiles.id,
          role: 'caregiver',
          added_by: user?.id,
        })

        if (error) throw error

        toast.success(`Added ${cleanEmail} as a caregiver!`)
      } else {
        // User doesn't exist - create invitation
        const token = crypto.randomUUID()

        const { error } = await supabase.from('baby_invitations').insert({
          baby_id: babyId,
          invited_email: cleanEmail,
          invited_by: user?.id,
          token: token,
        })

        if (error) throw error

        const inviteUrl = `http://192.168.1.83:3001/accept-invite?token=${token}`

        toast.success(
          <div>
            <div>Invitation sent to {cleanEmail}!</div>
            <div className="text-xs mt-1">Share this link with them:</div>
            <div className="text-xs bg-white p-2 rounded mt-1 break-all">{inviteUrl}</div>
          </div>,
          { duration: 10000 }
        )

        // Copy to clipboard
        await navigator.clipboard.writeText(inviteUrl)
        toast.success('Invite link copied to clipboard!', { duration: 2000 })
      }

      setEmail('')
      fetchData()
    } catch (error: any) {
      toast.error(error instanceof Error ? error.message : String(error) || 'Failed to add caregiver')
    } finally {
      setAddingCaregiver(false)
    }
  }

  const handleRemoveCaregiver = async (caregiverId: string, caregiverEmail: string) => {
    if (!confirm(`Remove ${caregiverEmail} as a caregiver?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('baby_caregivers')
        .delete()
        .eq('id', caregiverId)

      if (error) throw error

      toast.success('Caregiver removed')
      fetchData()
    } catch (error: any) {
      toast.error(error instanceof Error ? error.message : String(error) || 'Failed to remove caregiver')
    }
  }

  const handleCancelInvitation = async (invitationId: string, invitedEmail: string) => {
    if (!confirm(`Cancel invitation for ${invitedEmail}?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('baby_invitations')
        .delete()
        .eq('id', invitationId)

      if (error) throw error

      toast.success('Invitation cancelled')
      fetchData()
    } catch (error: any) {
      toast.error(error instanceof Error ? error.message : String(error) || 'Failed to cancel invitation')
    }
  }

  const copyInviteLink = async (token: string) => {
    const inviteUrl = `http://192.168.1.83:3001/accept-invite?token=${token}`
    await navigator.clipboard.writeText(inviteUrl)
    toast.success('Invite link copied to clipboard!')
  }

  return (
    <Card>
      <h3 className="text-xl font-bold text-gray-800 mb-4">
        Caregivers for {babyName}
      </h3>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
        </div>
      ) : (
        <>
          {/* Caregiver List */}
          {caregivers.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Active Caregivers</h4>
              <div className="space-y-3">
                {caregivers.map((caregiver) => (
                  <div
                    key={caregiver.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl"
                  >
                    <div>
                      <div className="font-semibold text-gray-800">
                        {caregiver.profile.email}
                        {caregiver.user_id === user?.id && (
                          <span className="ml-2 text-xs text-gray-500">(You)</span>
                        )}
                      </div>
                      {caregiver.profile.full_name && (
                        <div className="text-sm text-gray-600">{caregiver.profile.full_name}</div>
                      )}
                      <div className="text-xs text-gray-500 mt-1">
                        {caregiver.role === 'owner' ? '👑 Owner' : '👤 Caregiver'}
                      </div>
                    </div>
                    {isOwner && caregiver.role !== 'owner' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveCaregiver(caregiver.id, caregiver.profile.email)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pending Invitations */}
          {invitations.length > 0 && isOwner && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Pending Invitations</h4>
              <div className="space-y-3">
                {invitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="flex items-center justify-between p-4 bg-yellow-50 rounded-2xl border border-yellow-200"
                  >
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800">
                        {invitation.invited_email}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        ⏳ Waiting for signup
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyInviteLink(invitation.token)}
                      >
                        Copy Link
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelInvitation(invitation.id, invitation.invited_email)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Caregiver Form (only for owners) */}
          {isOwner && (
            <form onSubmit={handleAddCaregiver} className="border-t pt-4">
              <h4 className="font-semibold text-gray-800 mb-3">Add Caregiver</h4>
              <div className="flex gap-2">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="caregiver@example.com"
                  className="flex-1"
                  required
                />
                <Button type="submit" isLoading={addingCaregiver}>
                  Add
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                If they have an account, they'll be added immediately. Otherwise, we'll create an invitation link you can share with them.
              </p>
            </form>
          )}

          {!isOwner && (
            <p className="text-sm text-gray-600 border-t pt-4">
              You are a caregiver for this baby. Only the owner can add or remove caregivers.
            </p>
          )}
        </>
      )}
    </Card>
  )
}
