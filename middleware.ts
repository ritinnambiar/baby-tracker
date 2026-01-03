import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Protected routes that require authentication
  const protectedPaths = ['/dashboard', '/feeding', '/sleep', '/diaper', '/growth', '/pumping', '/medications', '/vaccinations', '/milestones', '/settings', '/analytics']
  const isProtectedPath = protectedPaths.some(path => pathname === path || pathname.startsWith(path + '/'))

  // Simple cookie-based auth check (lightweight for Edge Runtime)
  // Supabase stores auth in cookies with 'sb-' prefix
  const cookies = request.cookies
  const hasAuthCookie = cookies.getAll().some(cookie =>
    cookie.name.includes('sb-') && cookie.name.includes('auth-token')
  )

  // Redirect to login if accessing protected route without auth cookie
  if (isProtectedPath && !hasAuthCookie) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect to dashboard if accessing login/signup with auth cookie
  if ((pathname === '/login' || pathname === '/signup') && hasAuthCookie) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
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
