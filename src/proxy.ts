import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Redirects root requests to the default locale path and continues all other requests.
 *
 * @param request - The incoming request.
 * @returns A redirect response for the root path or a continuation response for other paths.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // If the pathname is exactly "/", redirect to the default locale "/fa"
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/fa", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/"],
};
