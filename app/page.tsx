'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-baby-pink via-baby-blue to-baby-yellow">
      <div className="text-center max-w-2xl">
        <h1 className="text-6xl font-bold text-primary-500 mb-4">
          Baby Tracker 👶
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Track your baby's feeding, sleep, diapers, and growth with ease
        </p>
        <div className="bg-white rounded-3xl p-8 shadow-soft mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="p-4">
              <div className="text-4xl mb-2">🍼</div>
              <p className="text-sm font-semibold text-gray-700">Feeding</p>
            </div>
            <div className="p-4">
              <div className="text-4xl mb-2">😴</div>
              <p className="text-sm font-semibold text-gray-700">Sleep</p>
            </div>
            <div className="p-4">
              <div className="text-4xl mb-2">🎯</div>
              <p className="text-sm font-semibold text-gray-700">Diapers</p>
            </div>
            <div className="p-4">
              <div className="text-4xl mb-2">📊</div>
              <p className="text-sm font-semibold text-gray-700">Growth</p>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg">Get Started</Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg">Sign In</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
