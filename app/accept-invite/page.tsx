'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import toast from 'react-hot-toast'

function AcceptInviteContent() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [invitation, setInvitation] = useState<any>(null)
  const [baby, setBaby] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [accepting, setAccepting] = useState(false)

  useEffect(() => {
    if (token) {
      loadInvitation()
    } else {
      setError('Invalid invitation link')
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  // Reload invitation when user logs in
  useEffect(() => {
    console.log('User changed, checking if need to reload invitation:', {
      hasUser: !!user,
      hasInvitation: !!invitation,
      hasBaby: !!baby
    })

    if (user && !baby) {
      // User is logged in but we don't have baby data yet - reload invitation
      console.log('User logged in, reloading invitation with auth')
      loadInvitation()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  useEffect(() => {
    console.log('Accept invitation check:', {
      hasUser: !!user,
      hasInvitation: !!invitation,
      hasBaby: !!baby,
      hasBabyId: !!invitation?.baby_id,
      accepting,
      user,
      invitation,
      baby
    })

    // We only need invitation.baby_id to accept, not the full baby object
    // (RLS blocks baby access until user is a caregiver)
    if (user && invitation && invitation.baby_id && !accepting) {
      console.log('All conditions met, calling acceptInvitation()')
      acceptInvitation()
    } else {
      console.log('Conditions not met for acceptance')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, invitation])

  const loadInvitation = async () => {
    console.log('loadInvitation() called, token:', token, 'user:', !!user)
    try {
      const { data, error } = await supabase
        .from('baby_invitations')
        .select(`
          *,
          baby:baby_id (
            id,
            name
          )
        `)
        .eq('token', token!)
        .single()

      console.log('Invitation query result:', { data, error })

      // If query fails due to RLS (user not authenticated), store minimal data
      // The unauthenticated UI will show login/signup options
      if (error) {
        console.log('Error loading invitation (possibly unauthenticated):', error)

        // For unauthenticated users, just store the token
        // We'll show login/signup UI instead of error
        if (error.code === 'PGRST116' || error.message?.includes('406')) {
          // Store minimal invitation data for unauthenticated state
          setInvitation({ token: token })
          setLoading(false)
          return
        }

        setError('Invitation not found or has expired')
        setLoading(false)
        return
      }

      if (!data) {
        setError('Invitation not found')
        setLoading(false)
        return
      }

      // Check if invitation was already accepted
      if (data.status === 'accepted') {
        setError(`You've already accepted this invitation for ${data.baby?.name || 'this baby'}!`)
        setLoading(false)
        return
      }

      // Check if invitation is not pending
      if (data.status !== 'pending') {
        setError('This invitation is no longer valid')
        setLoading(false)
        return
      }

      // Check if invitation has expired
      if (new Date(data.expires_at) < new Date()) {
        setError('This invitation has expired')
        setLoading(false)
        return
      }

      console.log('Setting invitation and baby state:', { invitation: data, baby: data.baby })
      setInvitation(data)
      setBaby(data.baby)
      setLoading(false)
    } catch (err: any) {
      console.error('Error loading invitation:', err)

      // Handle unauthenticated users gracefully
      if (!user) {
        setInvitation({ token: token })
        setLoading(false)
        return
      }

      setError('Failed to load invitation')
      setLoading(false)
    }
  }

  const acceptInvitation = async () => {
    if (!user || !invitation || !invitation.baby_id || accepting) return

    setAccepting(true)
    try {
      // Check if user's email matches the invitation
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', user.id)
        .single()

      if (profile?.email.toLowerCase() !== invitation.invited_email.toLowerCase()) {
        setError(`This invitation is for ${invitation.invited_email}. Please sign in with that email.`)
        setAccepting(false)
        return
      }

      // Check if user is already a caregiver (prevent duplicates)
      const { data: existingCaregiver } = await supabase
        .from('baby_caregivers')
        .select('id')
        .eq('baby_id', invitation.baby_id)
        .eq('user_id', user.id)
        .maybeSingle()

      if (existingCaregiver) {
        console.log('User is already a caregiver for this baby')
        toast.success(`You already have access to this baby!`)
        router.push('/dashboard')
        return
      }

      // Add user as caregiver
      console.log('Attempting to add caregiver:', {
        baby_id: invitation.baby_id,
        user_id: user.id,
        role: 'caregiver',
        added_by: invitation.invited_by,
      })

      const { data: newCaregiver, error: caregiverError } = await supabase
        .from('baby_caregivers')
        .insert({
          baby_id: invitation.baby_id,
          user_id: user.id,
          role: 'caregiver',
          added_by: invitation.invited_by,
        })
        .select()

      if (caregiverError) {
        console.error('Error adding caregiver:', caregiverError)
        console.error('Full error details:', JSON.stringify(caregiverError, null, 2))
        toast.error(`Failed to add caregiver: ${caregiverError.message || 'Unknown error'}`)
        throw caregiverError
      }

      if (!newCaregiver || newCaregiver.length === 0) {
        console.error('No caregiver record returned after INSERT')
        toast.error('Failed to add caregiver: No record created')
        return
      }

      console.log('Successfully added caregiver:', newCaregiver)

      // Verify the caregiver can now see the baby
      const { data: verifyBaby, error: verifyBabyError } = await supabase
        .from('babies')
        .select('id, name')
        .eq('id', invitation.baby_id)
        .maybeSingle()

      console.log('Verification - Can user see baby?', verifyBaby, verifyBabyError)

      // Mark invitation as accepted
      console.log('Attempting to update invitation status:', invitation.id)
      const { data: updatedInvitation, error: updateError } = await supabase
        .from('baby_invitations')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
        })
        .eq('id', invitation.id)
        .select()

      if (updateError) {
        console.error('Error updating invitation:', updateError)
        toast.error(`Caregiver added but failed to update invitation: ${updateError.message}`)
        // Don't throw - caregiver was already added successfully
      } else {
        console.log('Invitation updated successfully:', updatedInvitation)
      }

      const babyName = baby?.name || invitation.baby?.name || 'this baby'
      toast.success(`You're now a caregiver for ${babyName}!`)
      console.log('Redirecting to dashboard in 1 second...')

      // Wait a moment for the database to update, then redirect
      setTimeout(() => {
        console.log('Executing redirect now')
        router.push('/dashboard')
        // Force a page reload to refresh the baby list
        router.refresh()
      }, 1000)
    } catch (err: any) {
      console.error('Error accepting invitation:', err)
      toast.error(err.message || 'Failed to accept invitation')
      setAccepting(false) // Reset flag on error so user can try again
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-baby-pink via-baby-blue to-baby-yellow">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-baby-pink via-baby-blue to-baby-yellow p-4">
        <Card className="max-w-md text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Invitation Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link href="/login">
            <Button>Go to Login</Button>
          </Link>
        </Card>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-baby-pink via-baby-blue to-baby-yellow p-4">
        <Card className="max-w-md text-center">
          <div className="text-6xl mb-4">👶</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Baby Tracker Invitation</h2>
          <p className="text-gray-600 mb-2">
            {baby?.name
              ? `You've been invited to track ${baby.name}!`
              : "You've been invited to join a baby tracker!"}
          </p>
          {invitation?.invited_email && (
            <p className="text-sm text-gray-500 mb-6">
              Invitation for: <strong>{invitation.invited_email}</strong>
            </p>
          )}
          <div className="space-y-3">
            <Link href={`/signup?invite=${token}`}>
              <Button size="lg" className="w-full">
                Sign Up
              </Button>
            </Link>
            <Link href={`/login?invite=${token}`}>
              <Button variant="outline" size="lg" className="w-full">
                Already have an account? Log In
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-baby-pink via-baby-blue to-baby-yellow p-4">
      <Card className="max-w-md text-center">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Accepting Invitation...</h2>
        <p className="text-gray-600">
          Adding you as a caregiver for {baby?.name}
        </p>
      </Card>
    </div>
  )
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-baby-pink via-baby-blue to-baby-yellow">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
      </div>
    }>
      <AcceptInviteContent />
    </Suspense>
  )
}
