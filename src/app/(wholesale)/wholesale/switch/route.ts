import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { ACTIVE_COMPANY_COOKIE, getMemberships } from "@/modules/identity/service";
import { UnauthenticatedError } from "@/lib/errors";

const bodySchema = z.object({ companyId: z.uuid() });

/**
 * Sets the acting company. The value is only accepted when it matches one
 * of the caller's active memberships from the database.
 */
export async function POST(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const back = new URL("/wholesale/dashboard", origin);

  try {
    const form = await request.formData();
    const parsed = bodySchema.safeParse({ companyId: form.get("companyId") });
    if (!parsed.success) {
      return NextResponse.redirect(back, { status: 303 });
    }

    const memberships = await getMemberships();
    const allowed = memberships.some((m) => m.companyId === parsed.data.companyId);
    if (!allowed) {
      return NextResponse.redirect(back, { status: 303 });
    }

    const response = NextResponse.redirect(back, { status: 303 });
    response.cookies.set(ACTIVE_COMPANY_COOKIE, parsed.data.companyId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 90,
    });
    return response;
  } catch (error) {
    if (error instanceof UnauthenticatedError) {
      return NextResponse.redirect(new URL("/login", origin), { status: 303 });
    }
    throw error;
  }
}
