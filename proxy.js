import { NextResponse } from "next/server";
import { verifyJwt } from "./lib/jwt";

/**
 * Next.js Proxy for Route Authentication & Role-Based Authorization
 */
export async function proxy(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("safirpass_session")?.value;
  const session = token ? await verifyJwt(token) : null;
  const isAuthenticated = Boolean(session && session.id);
  const isAdmin =
    session?.role === "admin" || session?.user_metadata?.role === "admin";

  // 1. If user is already authenticated and attempts to visit /auth, redirect to their home
  if (pathname === "/auth" && isAuthenticated) {
    const destination = isAdmin ? "/admin" : "/dashboard";
    return NextResponse.redirect(new URL(destination, request.url));
  }

  // 2. Protect Admin Console pages: strictly require role === "admin"
  if (pathname.startsWith("/admin")) {
    if (!isAuthenticated) {
      const authUrl = new URL("/auth", request.url);
      authUrl.searchParams.set("redirect", pathname);
      authUrl.searchParams.set("mode", "admin");
      return NextResponse.redirect(authUrl);
    }
    if (!isAdmin) {
      // Logged in as standard tourist: forbidden from admin hub, redirect to tourist dashboard
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // 3. Protect Admin APIs (excluding the admin login endpoint /api/admin/auth)
  if (
    pathname.startsWith("/api/admin") &&
    !pathname.startsWith("/api/admin/auth")
  ) {
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: "Unauthorized. Admin authentication required." },
        { status: 401 },
      );
    }
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Forbidden. Administrative clearance required." },
        { status: 403 },
      );
    }
    return NextResponse.next();
  }

  // 4. Protected Personal & Operational Pages (Require Authentication)
  // Dashboard tools, KYC verification, Digital ID, consent management, emergency broadcast
  const protectedPages = ["/dashboard"];

  const isProtectedPage = protectedPages.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (isProtectedPage && !isAuthenticated) {
    const authUrl = new URL("/auth", request.url);
    authUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(authUrl);
  }

  // 5. Protected User APIs
  const protectedApis = ["/api/kyc", "/api/consent", "/api/sos"];
  const isProtectedApi = protectedApis.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (isProtectedApi && !isAuthenticated) {
    return NextResponse.json(
      { error: "Unauthorized. Active authentication session required." },
      { status: 401 },
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico
     * - /assets (public imagery)
     * - file extensions (.svg, .png, .jpg, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|assets/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
