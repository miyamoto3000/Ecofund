import { NextResponse } from "next/server";

export function middleware(req) {
    const token = req.cookies.get("token")?.value; 
    const protectedRoutes = ["/ngo-dashboard", "/donor-dashboard"];
    const isProtectedRoute = protectedRoutes.some(route => req.nextUrl.pathname.startsWith(route));

    // Allow public pages without authentication
    if (!isProtectedRoute) {
        return NextResponse.next();
    }

    // If user tries to access a protected route without a token, redirect to login
    if (!token) {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next(); // Allow access if authenticated
}

export const config = {
    matcher: ["/ngo-dashboard/:path*", "/donor-dashboard/:path*"], // ✅ Only protect dashboards
};
