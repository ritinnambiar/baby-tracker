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

  useEffect(() => {
    if (token) {
      loadInvitation()
    } else {
      setError('Invalid invitation link')
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  useEffect(() => {
    if (user && invitation) {
      acceptInvitation()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, invitation])

  const loadInvitation = async () => {
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
        .eq('status', 'pending')
        .single()

      if (error || !data) {
        setError('Invitation not found or has expired')
        setLoading(false)
        return
      }

      // Check if invitation has expired
      if (new Date(data.expires_at) < new Date()) {
        setError('This invitation has expired')
        setLoading(false)
        return
      }

      setInvitation(data)
      setBaby(data.baby)
      setLoading(false)
    } catch (err) {
      console.error('Error loading invitation:', err)
      setError('Failed to load invitation')
      setLoading(false)
    }
  }

  const acceptInvitation = async () => {
    if (!user || !invitation) return

    try {
      // Check if user's email matches the invitation
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', user.id)
        .single()

      if (profile?.email.toLowerCase() !== invitation.invited_email.toLowerCase()) {
        setError(`This invitation is for ${invitation.invited_email}. Please sign in with that email.`)
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
        toast.success(`You already have access to ${baby.name}!`)
        router.push('/dashboard')
        return
      }

      // Add user as caregiver
      const { error: caregiverError } = await supabase.from('baby_caregivers').insert({
        baby_id: invitation.baby_id,
        user_id: user.id,
        role: 'caregiver',
        added_by: invitation.invited_by,
      })

      if (caregiverError) {
        console.error('Error adding caregiver:', caregiverError)
        throw caregiverError
      }

      console.log('Successfully added caregiver for baby:', invitation.baby_id)

      // Mark invitation as accepted
      const { error: updateError } = await supabase
        .from('baby_invitations')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
        })
        .eq('id', invitation.id)

      if (updateError) throw updateError

      toast.success(`You're now a caregiver for ${baby.name}!`)

      // Wait a moment for the database to update, then redirect
      setTimeout(() => {
        router.push('/dashboard')
        // Force a page reload to refresh the baby list
        router.refresh()
      }, 500)
    } catch (err: any) {
      console.error('Error accepting invitation:', err)
      toast.error(err.message || 'Failed to accept invitation')
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
            You've been invited to track <strong>{baby?.name}</strong>!
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Invitation for: <strong>{invitation?.invited_email}</strong>
          </p>
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
