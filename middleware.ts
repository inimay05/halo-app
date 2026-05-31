import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet) => {
          toSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          toSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session (MUST happen before any auth checks)
  const { data: { user } } = await supabase.auth.getUser()
  const verified = request.cookies.get('parent_verified')?.value === '1'

  // ── /dashboard (legacy route group) requires session + verified PIN ──
  if (pathname === '/dashboard') {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    if (!verified) {
      return NextResponse.redirect(new URL('/verify-pin', request.url))
    }
  }

  // ── /parent/* requires session + verified PIN ──
  if (pathname.startsWith('/parent')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    if (!verified) {
      return NextResponse.redirect(new URL('/verify-pin', request.url))
    }
  }

  // ── /child/* requires session + active child cookie ──
  if (pathname.startsWith('/child')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    const activeChild = request.cookies.get('active_child_id')?.value
    if (!activeChild) {
      return NextResponse.redirect(new URL('/parent', request.url))
    }
  }

  // ── /verify-pin: skip if already verified ──
  if (pathname === '/verify-pin') {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    if (verified) {
      return NextResponse.redirect(new URL('/parent', request.url))
    }
  }

  // ── Auth pages redirect authenticated users away ──
  const authPaths = ['/login', '/register']
  if (authPaths.includes(pathname) && user) {
    if (verified) {
      return NextResponse.redirect(new URL('/parent', request.url))
    }
    return NextResponse.redirect(new URL('/verify-pin', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/|design).*)',
  ],
}
