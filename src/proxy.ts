import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { STATIC_PREVIEW, supabaseEnv } from "@/lib/env";
import { DEMO_SESSION_COOKIE, parseDemoAccountKey } from "@/modules/demo/session";

/**
 * Refreshes the Supabase session cookie on every request and keeps
 * unauthenticated visitors out of the portal and admin areas.
 *
 * This is a convenience redirect, not the authorization boundary. Every
 * layout re-checks identity, membership and staff status server-side, and
 * every database read is governed by RLS.
 *
 * In static preview there is no Supabase session; the test account cookie
 * (see modules/demo) stands in for it, with the same redirects.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Products are public; the catalog pages decide who sees prices.
  const publicWholesale = ["/wholesale/apply", "/wholesale/catalog", "/wholesale/products"].some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  const protectedArea =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/mfa") ||
    (pathname.startsWith("/wholesale") && !publicWholesale);

  if (STATIC_PREVIEW) {
    const demoAccount = parseDemoAccountKey(request.cookies.get(DEMO_SESSION_COOKIE)?.value);
    if (!demoAccount && protectedArea) return redirectToLogin(request);
    if (demoAccount && (pathname === "/login" || pathname === "/")) {
      return redirectTo(request, demoAccount === "admin" ? "/admin" : "/wholesale/dashboard");
    }
    const response = NextResponse.next({ request });
    if (demoAccount) response.headers.set("Cache-Control", "private, no-store");
    return response;
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

  if (!user && protectedArea) return redirectToLogin(request);

  if (user && (pathname === "/login" || pathname === "/")) {
    return redirectTo(request, "/wholesale/dashboard");
  }

  // Personalized responses must never be cached across users.
  if (user) {
    response.headers.set("Cache-Control", "private, no-store");
  }

  return response;
}

function redirectToLogin(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  url.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

function redirectTo(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    // Skip static assets and images; run on everything else.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
