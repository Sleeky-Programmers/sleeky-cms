import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Paths anyone can open. Everything else needs a session.
const PUBLIC_PATHS = [/^\/sign-in$/, /^\/forgot-password$/, /^\/reset-password$/, /^\/invite\/[^/]+$/, /^\/api\/auth\//];

/**
 * Optimistic check only: sends visitors without a session cookie to sign-in
 * before rendering anything. Every page and Server Action still verifies the
 * session itself (src/lib/session.ts); a cookie here proves nothing on its own.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (PUBLIC_PATHS.some((path) => path.test(pathname))) return NextResponse.next();

  if (!getSessionCookie(request)) {
    const signIn = new URL("/sign-in", request.url);
    if (pathname !== "/") signIn.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(signIn);
  }
  return NextResponse.next();
}

export const config = {
  // Skip Next.js internals and static files.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|brand/|.*\\.(?:svg|png|jpg|jpeg|webp|ico|woff2?)$).*)"],
};
