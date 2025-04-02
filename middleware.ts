import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Get cookies
  const isAuthenticated = request.cookies.get("isAuthenticated")?.value
  const userRole = request.cookies.get("userRole")?.value

  // Get the path
  const { pathname } = request.nextUrl

  // If not authenticated and trying to access protected routes, redirect to login
  if (!isAuthenticated && (pathname.startsWith("/admin") || pathname.startsWith("/customer/dashboard"))) {
    // Exclude login page from redirect
    if (pathname !== "/admin/login") {
      return NextResponse.redirect(new URL("/admin/login", request.url))
    }
  }

  // If authenticated, handle role-based access
  if (isAuthenticated) {
    // Admin trying to access customer routes
    if (userRole === "admin" && pathname.startsWith("/customer/dashboard")) {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url))
    }

    // Customer trying to access admin routes
    if (userRole === "customer" && pathname.startsWith("/admin") && pathname !== "/admin/login") {
      return NextResponse.redirect(new URL("/customer/dashboard", request.url))
    }

    // Redirect from login page if already authenticated
    if (pathname === "/admin/login") {
      if (userRole === "admin") {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url))
      } else {
        return NextResponse.redirect(new URL("/customer/dashboard", request.url))
      }
    }
  }

  return NextResponse.next()
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: ["/admin/:path*", "/customer/dashboard/:path*"],
}

