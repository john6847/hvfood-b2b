import { NextResponse, type NextRequest } from "next/server";
import { STATIC_PREVIEW } from "@/lib/env";
import { createSessionClient } from "@/lib/supabase/server";

/** POST-only sign out so a plain link cannot log someone out. */
export async function POST(request: NextRequest) {
  if (STATIC_PREVIEW) {
    return NextResponse.redirect(new URL("/", request.nextUrl.origin), { status: 303 });
  }
  const supabase = await createSessionClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/login", request.nextUrl.origin), { status: 303 });
}
