import { NextResponse, type NextRequest } from "next/server";
import { STATIC_PREVIEW } from "@/lib/env";
import { createSessionClient } from "@/lib/supabase/server";
import { DEMO_SESSION_COOKIE } from "@/modules/demo/session";

/** POST-only sign out so a plain link cannot log someone out. */
export async function POST(request: NextRequest) {
  if (STATIC_PREVIEW) {
    const response = NextResponse.redirect(new URL("/login", request.nextUrl.origin), { status: 303 });
    response.cookies.delete(DEMO_SESSION_COOKIE);
    return response;
  }
  const supabase = await createSessionClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/login", request.nextUrl.origin), { status: 303 });
}
