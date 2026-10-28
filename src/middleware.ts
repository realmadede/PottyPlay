import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const host = req.headers.get("host") || "";
  const { pathname } = req.nextUrl;

  // Static assets, Next internals, and public asset paths bypass middleware routing
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/brand-mark") ||
    pathname.startsWith("/logo") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || "";
  const isDev = process.env.NODE_ENV !== "production" || host.includes("localhost") || host.includes("127.0.0.1") || host.includes("192.168.");

  // Identify subdomain target
  const isSetapartHost = host.startsWith("setapart.") || req.headers.get("x-pottyplay-host") === "setapart";
  const isOperationsHost = host.startsWith("operations.") || req.headers.get("x-pottyplay-host") === "operations";

  // 1. Administration Hostname: setapart.pottyplay.<domain>
  if (isSetapartHost) {
    // If root on admin host, rewrite to /admin
    if (pathname === "/") {
      const url = req.nextUrl.clone();
      url.pathname = "/admin";
      return NextResponse.rewrite(url);
    }

    // Prohibit cross-host access to customer player or operator workspace on admin hostname
    if (pathname.startsWith("/watch") || pathname.startsWith("/app")) {
      return new NextResponse("Not Found", { status: 404 });
    }

    return NextResponse.next();
  }

  // 2. Cinema Operations Hostname: operations.pottyplay.<domain>
  if (isOperationsHost) {
    // If root on operations host, rewrite to /operator
    if (pathname === "/") {
      const url = req.nextUrl.clone();
      url.pathname = "/operator";
      return NextResponse.rewrite(url);
    }

    // Prohibit platform administration access on operations hostname
    if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
      return new NextResponse("Not Found", { status: 404 });
    }

    return NextResponse.next();
  }

  // 3. Public Marketing Hostname: pottyplay.<domain> (Default)
  // In production (or when baseDomain configured), public hostname MUST NOT expose private admin portal
  if (!isDev && (pathname.startsWith("/admin") || pathname.startsWith("/api/admin"))) {
    // Reject private admin requests on public marketing host without leaking administrative existence
    return new NextResponse("Not Found", { status: 404 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, favicon.svg
     */
    "/((?!_next/static|_next/image|favicon.ico|favicon.svg).*)",
  ],
};
