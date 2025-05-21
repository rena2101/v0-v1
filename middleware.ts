import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  try {
    // Create a Supabase client specifically for the middleware
    const supabase = createMiddlewareClient({ req, res })

    // Refresh session if expired - this will update the cookie if needed
    await supabase.auth.getSession()

    // Get the session after potential refresh
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // Check if we're on an auth page
    const isAuthPage = req.nextUrl.pathname.startsWith("/auth")

    // Check if we're on the root page (landing page)
    const isRootPage = req.nextUrl.pathname === "/"

    // Check if we're on a protected route
    const isProtectedRoute =
      req.nextUrl.pathname.startsWith("/dashboard") ||
      req.nextUrl.pathname.startsWith("/books") ||
      req.nextUrl.pathname.startsWith("/highlights") ||
      req.nextUrl.pathname.startsWith("/library") ||
      req.nextUrl.pathname.startsWith("/settings") ||
      req.nextUrl.pathname.startsWith("/email-preview") ||
      req.nextUrl.pathname.startsWith("/test-email") ||
      req.nextUrl.pathname.startsWith("/admin")

    // If user is signed in and on an auth page, redirect to dashboard
    if (session && isAuthPage && req.nextUrl.pathname !== "/auth/callback") {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    // If user is not signed in and on a protected page, redirect to login
    if (!session && isProtectedRoute) {
      return NextResponse.redirect(new URL("/auth/login", req.url))
    }
  } catch (error) {
    console.error("Middleware error:", error)
    // Continue with the request even if there's an error
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
}
