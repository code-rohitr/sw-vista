import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from './lib/jwt'

// Define public routes that don't require authentication
const publicRoutes = [
  '/login',
  '/api/auth/login',
  '/api/auth/register',
  '/',
  '/favicon.ico',
  '/_next',
  '/static',
]

// Define API routes that should bypass the middleware
const bypassRoutes = [
  '/api/auth/login',
  '/api/auth/register',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if the path is public
  const isPublicPath = publicRoutes.some(route => 
    pathname.startsWith(route)
  )

  // Check if the path should bypass middleware
  const shouldBypass = bypassRoutes.some(route => 
    pathname.startsWith(route)
  )

  if (shouldBypass) {
    return NextResponse.next()
  }

  // Get token from Authorization header or cookie
  const headerToken = request.headers.get('authorization')?.split(' ')[1]
  const cookieToken = request.cookies.get('auth_token')?.value
  const token = headerToken || cookieToken

  // If it's a public path, allow access
  if (isPublicPath) {
    return NextResponse.next()
  }

  // If no token is present, redirect to login or return unauthorized
  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    // Verify token
    const decoded = verifyToken(token)
    if (!decoded) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { message: 'Invalid token' },
          { status: 401 }
        )
      }
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Token is valid, allow request
    const response = NextResponse.next()
    
    // Add user info to headers for downstream use
    response.headers.set('X-User-ID', decoded.id)
    response.headers.set('X-User-Role', decoded.isSystemAdmin ? 'admin' : 'user')
    
    // If token was from header, set it as a cookie for consistency
    if (headerToken && !cookieToken) {
      response.cookies.set({
        name: 'auth_token',
        value: headerToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 // 24 hours
      })
    }
    
    return response
  } catch (error) {
    console.error('Auth middleware error:', error)
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { message: 'Authentication error' },
        { status: 401 }
      )
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

// Configure which routes should be handled by this middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. /api/auth/* (authentication endpoints)
     * 2. /_next/* (Next.js internals)
     * 3. /static/* (static files)
     * 4. /favicon.ico, /sitemap.xml (public files)
     */
    '/((?!api/auth|_next/static|_next/image|static|favicon.ico|sitemap.xml).*)',
  ],
} 