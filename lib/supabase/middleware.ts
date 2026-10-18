import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { canAccessAdminPath, defaultAdminPath, isStaffRole } from '@/lib/admin-access'

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const isAdmin = pathname === '/admin' || pathname.startsWith('/admin/')
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    return isAdmin
      ? NextResponse.json({ error: 'Staff sign-in is temporarily unavailable.' }, { status: 503 })
      : NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: If you remove getUser() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (isAdmin) {
    const login = pathname === '/admin/login'
    if (pathname === '/admin/welcome') return supabaseResponse
    const { data: profile } = user
      ? await supabase.from('admin_profiles').select('role, is_active').eq('id', user.id).eq('is_active', true).maybeSingle()
      : { data: null }
    const role = profile && isStaffRole(profile.role) ? profile.role : null

    function redirect(path: string) {
      const response = NextResponse.redirect(new URL(path, request.url))
      supabaseResponse.cookies.getAll().forEach(cookie => response.cookies.set(cookie))
      return response
    }

    if (!login && !role) return redirect('/admin/login')
    if (login && role) return redirect(defaultAdminPath(role))
    if (role && !canAccessAdminPath(role, pathname)) return redirect(defaultAdminPath(role))
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}
