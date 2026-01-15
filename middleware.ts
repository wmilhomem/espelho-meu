import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://vbzsvedibjdvrdauvcet.supabase.co"
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZienN2ZWRpYmpkdnJkYXV2Y2V0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4MTYxNDksImV4cCI6MjA4MDM5MjE0OX0.gqLBTjBXUEo0vB1Fky99u3ZuenQkJI23-pYyV9xAQTk"

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
    auth: {
      storageKey: "espelho-meu-auth",
      flowType: "pkce",
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const { pathname } = request.nextUrl

  console.log("[v0][Middleware] Path:", pathname, "Has session:", !!session)

  const protectedRoutes = ["/atelier"]
  const publicRoutes = ["/", "/login", "/lojas", "/loja"]

  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))
  const isPublicRoute = publicRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))

  if (isProtectedRoute && !session) {
    console.log("[v0][Middleware] Blocking protected route, redirecting to login")
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/login"
    redirectUrl.searchParams.set("redirectTo", pathname)
    return NextResponse.redirect(redirectUrl)
  }

  if (pathname === "/login" && session) {
    console.log("[v0][Middleware] User logged in, redirecting from login")
    const redirectUrl = request.nextUrl.clone()
    const redirectTo = request.nextUrl.searchParams.get("redirectTo")
    redirectUrl.pathname = redirectTo || "/atelier"
    redirectUrl.searchParams.delete("redirectTo")
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
