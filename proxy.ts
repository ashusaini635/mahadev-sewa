import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Public routes
  if (pathname === "/login") {
    if (session) {
      const role = session.user?.role;
      return NextResponse.redirect(
        new URL(role === "admin" ? "/admin" : "/dashboard", req.url)
      );
    }
    return NextResponse.next();
  }

  // Protected routes — must be logged in
  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Admin-only routes
  if (pathname.startsWith("/admin") && session.user?.role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Member dashboard — redirect admins to admin panel
  if (pathname === "/dashboard" && session.user?.role === "admin") {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/", "/login", "/admin/:path*", "/dashboard/:path*"],
};

