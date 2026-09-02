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
      const target = req.nextUrl.clone();
      target.pathname = role === "admin" ? "/admin" : "/dashboard";
      return NextResponse.redirect(target);
    }
    return NextResponse.next();
  }

  // Protected routes — must be logged in
  if (!session) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  // Admin-only routes
  if (pathname.startsWith("/admin") && session.user?.role !== "admin") {
    const dashboardUrl = req.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    return NextResponse.redirect(dashboardUrl);
  }

  // Member dashboard — redirect admins to admin panel
  if (pathname === "/dashboard" && session.user?.role === "admin") {
    const adminUrl = req.nextUrl.clone();
    adminUrl.pathname = "/admin";
    return NextResponse.redirect(adminUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/", "/login", "/admin/:path*", "/dashboard/:path*"],
};

