import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // List of protected paths
  const protectedPaths = ['/dashboard', '/feeding', '/sleep', '/diaper', '/growth', '/pumping', '/medications', '/vaccinations', '/milestones', '/settings', '/analytics']
  const isProtectedPath = protectedPaths.some(path => pathname === path || pathname.startsWith(path + '/'))

  // Skip auth check if env vars are missing - just allow through
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.log('Middleware: Missing Supabase env vars')
    return NextResponse.next({ request })
  }

  try {
    let response = NextResponse.next({ request })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => {
              request.cookies.set(name, value)
            })
            response = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    // Get user with timeout protection
    const { data: { user } } = await Promise.race([
      supabase.auth.getUser(),
      new Promise<{ data: { user: null } }>((resolve) =>
        setTimeout(() => resolve({ data: { user: null } }), 3000)
      )
    ])

    // Redirect unauthenticated users away from protected routes
    if (!user && isProtectedPath) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/login'
      return NextResponse.redirect(redirectUrl)
    }

    // Redirect authenticated users away from auth pages
    if (user && (pathname === '/login' || pathname === '/signup')) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/dashboard'
      return NextResponse.redirect(redirectUrl)
    }

    return response
  } catch (error) {
    // On any error, just allow the request through
    console.error('Middleware error:', error)
    return NextResponse.next({ request })
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
