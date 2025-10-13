import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow access to public routes and API routes
  const publicRoutes = [
    "/",
    "/access",
    "/api",
    "/_next",
    "/favicon.ico",
    "/public",
  ];

  // Check if the current path should be publicly accessible
  const isPublicRoute = publicRoutes.some(
    (route) => pathname.startsWith(route) || pathname === route
  );

  // If it's a public route, allow it
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // For protected routes, we'll let the client-side AccessGateProvider handle the logic
  // since we need to check Firebase auth state and user data
  // This middleware mainly serves as documentation and can be extended for additional security
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
