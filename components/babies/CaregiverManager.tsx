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

  // Auto-refresh when page becomes visible (user switches back to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchData()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [babyId])

  // Also refresh when component re-mounts (e.g., accordion opens/closes)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData()
    }, 100)
    return () => clearTimeout(timer)
  }, [babyId])

  const fetchData = async () => {
    await Promise.all([fetchCaregivers(), fetchInvitations()])
  }

  const fetchCaregivers = async () => {
    try {
      // First get caregivers
      const { data: caregiversData, error: caregiversError } = await supabase
        .from('baby_caregivers')
        .select('*')
        .eq('baby_id', babyId)
        .order('role', { ascending: false }) // owners first

      if (caregiversError) throw caregiversError

      console.log('Fetched caregivers from baby_caregivers:', caregiversData)

      // Then get profiles for each caregiver
      if (caregiversData && caregiversData.length > 0) {
        const userIds = caregiversData.map(c => c.user_id)
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .in('id', userIds)

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError)
        }

        console.log('Fetched profiles:', profilesData)

        // Combine caregivers with profiles
        const combinedData = caregiversData.map(caregiver => ({
          ...caregiver,
          profile: profilesData?.find(p => p.id === caregiver.user_id) || { email: 'Unknown', full_name: null }
        }))

        console.log('Combined caregivers with profiles:', combinedData)
        setCaregivers(combinedData)
      } else {
        setCaregivers([])
      }

      // Check if current user is owner
      const userCaregiver = caregiversData?.find((c) => c.user_id === user?.id)
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

      // Check if already a caregiver
      const existingCaregiver = caregivers.find((c) => c.profile.email === cleanEmail)
      if (existingCaregiver) {
        toast.error('This user is already a caregiver for this baby')
        setAddingCaregiver(false)
        return
      }

      // Check if already has a pending invitation
      const existingInvitation = invitations.find((i) => i.invited_email === cleanEmail)
      if (existingInvitation) {
        toast.error('This email already has a pending invitation')
        setAddingCaregiver(false)
        return
      }

      // Check if there's an old accepted/expired invitation and delete it
      const { error: deleteOldError } = await supabase
        .from('baby_invitations')
        .delete()
        .eq('baby_id', babyId)
        .eq('invited_email', cleanEmail)
        .neq('status', 'pending')

      if (deleteOldError) {
        console.error('Error deleting old invitation:', deleteOldError)
      }

      // Check if user exists
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', cleanEmail)
        .maybeSingle()

      if (profiles) {
        // User exists - add directly as caregiver
        const { error } = await supabase.from('baby_caregivers').insert({
          baby_id: babyId,
          user_id: profiles.id,
          role: 'caregiver',
          added_by: user?.id,
        })

        if (error) throw error

        toast.success(`Added ${cleanEmail} as a caregiver!`)

        // Refresh data to show new caregiver
        await fetchData()
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

        // Use window.location to get current host and port
        const inviteUrl = `${window.location.origin}/accept-invite?token=${token}`

        // Send email invitation
        try {
          // Get inviter profile for their name
          const { data: inviterProfile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', user?.id)
            .single()

          const response = await fetch('/api/send-invitation', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: cleanEmail,
              inviteUrl,
              babyName,
              inviterName: inviterProfile?.full_name || inviterProfile?.email || 'Someone',
            }),
          })

          if (response.ok) {
            toast.success(`Invitation email sent to ${cleanEmail}!`)
          } else {
            // Email failed but invitation was created
            const errorData = await response.json()
            console.error('Email failed:', errorData)

            toast(
              <div>
                <div className="font-semibold mb-2">Invitation created for {cleanEmail}!</div>
                <div className="text-xs mb-2" style={{ color: 'rgb(100, 100, 100)' }}>
                  {errorData.error?.includes('testing emails')
                    ? `⚠️ For testing, use ritin.nambiar@gmail.com or verify a domain at resend.com/domains`
                    : 'Email failed to send. Share this link manually:'}
                </div>
                <div className="text-xs bg-gray-800 text-white p-3 rounded-lg mt-2 break-all font-mono">{inviteUrl}</div>
              </div>,
              { duration: 15000, icon: '📧', style: { background: '#fff', color: '#000' } }
            )
          }
        } catch (emailError) {
          console.error('Email error:', emailError)
          // Show fallback toast with manual link
          toast(
            <div>
              <div className="font-semibold mb-2">Invitation created for {cleanEmail}!</div>
              <div className="text-xs mb-2" style={{ color: 'rgb(100, 100, 100)' }}>Share this link with them:</div>
              <div className="text-xs bg-gray-800 text-white p-3 rounded-lg mt-2 break-all font-mono">{inviteUrl}</div>
            </div>,
            { duration: 15000, icon: '📧', style: { background: '#fff', color: '#000' } }
          )
        }

        // Copy to clipboard
        await navigator.clipboard.writeText(inviteUrl)
        toast.success('Invite link copied to clipboard!', { duration: 2000 })

        // Refresh data to show new invitation
        await fetchData()
      }

      setEmail('')
    } catch (error: any) {
      console.error('Error adding caregiver:', error)
      const errorMessage = error?.message || error?.error_description || error?.hint || 'Failed to add caregiver'
      toast.error(errorMessage)
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
      console.error('Error removing caregiver:', error)
      const errorMessage = error?.message || error?.error_description || error?.hint || 'Failed to remove caregiver'
      toast.error(errorMessage)
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
      console.error('Error cancelling invitation:', error)
      const errorMessage = error?.message || error?.error_description || error?.hint || 'Failed to cancel invitation'
      toast.error(errorMessage)
    }
  }

  const copyInviteLink = async (token: string) => {
    const inviteUrl = `${window.location.origin}/accept-invite?token=${token}`
    await navigator.clipboard.writeText(inviteUrl)
    toast.success('Invite link copied to clipboard!')
  }

  return (
    <Card>
      <div className="mb-4">
        <h3 className="text-xl font-bold" style={{ color: 'rgb(245, 245, 255)' }}>
          Caregivers for {babyName}
        </h3>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
        </div>
      ) : (
        <>
          {/* Caregiver List */}
          {caregivers.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-semibold mb-2" style={{ color: 'rgb(245, 245, 255)' }}>Active Caregivers</h4>
              <div className="space-y-3">
                {caregivers.map((caregiver) => (
                  <div
                    key={caregiver.id}
                    className="flex items-center justify-between p-4 bg-gray-800 rounded-2xl"
                  >
                    <div>
                      <div className="font-semibold" style={{ color: 'rgb(245, 245, 255)' }}>
                        {caregiver.profile.email}
                        {caregiver.user_id === user?.id && (
                          <span className="ml-2 text-xs" style={{ color: 'rgb(245, 245, 255)' }}>(You)</span>
                        )}
                      </div>
                      {caregiver.profile.full_name && (
                        <div className="text-sm" style={{ color: 'rgb(245, 245, 255)' }}>{caregiver.profile.full_name}</div>
                      )}
                      <div className="text-xs mt-1" style={{ color: 'rgb(245, 245, 255)' }}>
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
              <h4 className="text-sm font-semibold mb-2" style={{ color: 'rgb(245, 245, 255)' }}>Pending Invitations</h4>
              <div className="space-y-3">
                {invitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="flex items-center justify-between p-3 bg-gray-800 rounded-2xl border border-primary-500"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate" style={{ color: 'rgb(245, 245, 255)' }}>
                          {invitation.invited_email}
                        </div>
                        <div className="text-xs" style={{ color: 'rgb(245, 245, 255)' }}>
                          ⏳ Pending
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyInviteLink(invitation.token)}
                          className="text-xs px-2 py-1 h-7 text-gray-400 hover:!text-black"
                        >
                          Copy
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelInvitation(invitation.id, invitation.invited_email)}
                          className="text-xs px-2 py-1 h-7"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Caregiver Form (only for owners) */}
          {isOwner && (
            <form onSubmit={handleAddCaregiver} className="border-t pt-4 caregiver-form-white-labels">
              <h4 className="font-semibold mb-3" style={{ color: 'rgb(245, 245, 255)' }}>Add Caregiver</h4>
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
              <p className="text-xs mt-2" style={{ color: 'rgb(245, 245, 255)' }}>
                If they have an account, they'll be added immediately. Otherwise, we'll create an invitation link you can share with them.
              </p>
            </form>
          )}

          {!isOwner && (
            <p className="text-sm border-t pt-4" style={{ color: 'rgb(245, 245, 255)' }}>
              You are a caregiver for this baby. Only the owner can add or remove caregivers.
            </p>
          )}
        </>
      )}
    </Card>
  )
}
