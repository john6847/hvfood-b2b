import { NextResponse, type NextRequest } from "next/server";
import { STATIC_PREVIEW } from "@/lib/env";
import { createSessionClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/utils";

/**
 * PKCE code exchange for email links (password reset now; invitations and
 * email change later). Only relative `next` targets are honored.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  if (STATIC_PREVIEW) return NextResponse.redirect(`${origin}/wholesale/dashboard`);

  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"), "/wholesale/dashboard");

  if (code) {
    const supabase = await createSessionClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=link`);
}
