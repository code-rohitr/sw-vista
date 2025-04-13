import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth({
  callbacks: {
    authorized: ({ token }) => !!token,
  },
});

// Protect all routes except public ones
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/venues/:path*",
    "/proposals/:path*",
    "/bookings/:path*",
    "/reports/:path*",
    "/clubs/:path*",
    "/logs/:path*",
  ],
}; 