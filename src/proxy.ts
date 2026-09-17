import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { STATIC_PREVIEW, supabaseEnv } from "@/lib/env";

/**
 * Refreshes the Supabase session cookie on every request and keeps
 * unauthenticated visitors out of the portal and admin areas.
 *
 * This is a convenience redirect, not the authorization boundary. Every
 * layout re-checks identity, membership and staff status server-side, and
 * every database read is governed by RLS.
 *
 * In static preview there is no session to refresh and nothing to protect,
 * so the request passes straight through.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (STATIC_PREVIEW) {
    // Sign-in has no meaning without a database; send it to the portal.
    if (pathname === "/login" || pathname === "/mfa") {
      const url = request.nextUrl.clone();
      url.pathname = "/wholesale/dashboard";
      url.search = "";
      return NextResponse.redirect(url);
    }
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const { url: supabaseUrl, anonKey } = supabaseEnv();

  const supabase = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // getUser() validates against Auth; never trust getSession() alone here.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const protectedArea =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/mfa") ||
    (pathname.startsWith("/wholesale") && !pathname.startsWith("/wholesale/apply"));

  if (!user && protectedArea) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (user && (pathname === "/login" || pathname === "/")) {
    const url = request.nextUrl.clone();
    url.pathname = "/wholesale/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Personalized responses must never be cached across users.
  if (user) {
    response.headers.set("Cache-Control", "private, no-store");
  }

  return response;
}

export const config = {
  matcher: [
    // Skip static assets and images; run on everything else.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
