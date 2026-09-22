import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { STATIC_PREVIEW } from "@/lib/env";
import { createSessionClient } from "@/lib/supabase/server";
import { ForbiddenError, MfaRequiredError, UnauthenticatedError } from "@/lib/errors";
import { findDemoAccount } from "@/modules/demo/accounts";
import {
  DEMO_ACTIVE_COMPANY_ID,
  DEMO_MEMBERSHIPS,
  DEMO_STAFF,
  DEMO_USER_IDS,
} from "@/modules/demo/fixtures";
import { DEMO_SESSION_COOKIE, parseDemoAccountKey, type DemoAccountKey } from "@/modules/demo/session";
import {
  resolveActiveMembership,
  type CompanyRole,
  type CompanyStatus,
  type Membership,
} from "./company-access";
import { PERMISSION_CODES, hasPermission, type Permission } from "./permissions";

/**
 * Identity module: the only place server code asks "who is this and what
 * may they do". On the connected path everything is derived from the
 * verified session and the database, never from client-supplied ids or
 * user metadata.
 *
 * In static preview (no Supabase configured) these return fixtures for
 * whichever test account is signed in (see modules/demo), so the design can
 * be reviewed without a database. The buyer belongs to an approved company;
 * the admin is staff with no company. That path is unreachable the moment
 * a Supabase project is configured.
 */

export const ACTIVE_COMPANY_COOKIE = "hv_company";

export type SessionUser = { id: string; email: string | null };

export type StaffContext = {
  staffUserId: string;
  roleCode: string;
  roleName: string;
  mfaVerified: boolean;
  /** Policy switch from the database (private.staff_mfa_required). */
  mfaRequired: boolean;
  permissions: readonly string[];
};

export type MfaState = {
  currentLevel: "aal1" | "aal2";
  nextLevel: "aal1" | "aal2";
};

/** The static preview test account signed in on this request, if any. */
const getDemoAccountKey = cache(async (): Promise<DemoAccountKey | null> => {
  const cookieStore = await cookies();
  return parseDemoAccountKey(cookieStore.get(DEMO_SESSION_COOKIE)?.value);
});

export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  if (STATIC_PREVIEW) {
    const key = await getDemoAccountKey();
    return key ? { id: DEMO_USER_IDS[key], email: findDemoAccount(key).email } : null;
  }

  const supabase = await createSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? { id: user.id, email: user.email ?? null } : null;
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new UnauthenticatedError();
  return user;
}

export const getProfile = cache(async () => {
  if (STATIC_PREVIEW) {
    const user = await requireUser();
    const key = (await getDemoAccountKey())!;
    const account = findDemoAccount(key);
    return {
      id: user.id,
      email: account.email,
      first_name: account.firstName,
      last_name: account.lastName,
      phone: null as string | null,
      locale: "en-US",
    };
  }

  const user = await requireUser();
  const supabase = await createSessionClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, first_name, last_name, phone, locale")
    .eq("id", user.id)
    .maybeSingle();
  if (error) throw error;
  return data;
});

/** Every active membership for the signed-in person. */
export const getMemberships = cache(async (): Promise<Membership[]> => {
  if (STATIC_PREVIEW) return (await getDemoAccountKey()) === "buyer" ? DEMO_MEMBERSHIPS : [];

  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createSessionClient();
  const { data, error } = await supabase.rpc("current_memberships");
  if (error) throw error;
  return (data ?? []).map((row) => ({
    membershipId: row.membership_id,
    companyId: row.company_id,
    companyDisplayName: row.company_display_name,
    companyStatus: row.company_status as CompanyStatus,
    role: row.role as CompanyRole,
  }));
});

/**
 * The company this session acts in. The cookie is only a preference; the
 * membership list from the database decides what is allowed.
 */
export const getActiveMembership = cache(async (): Promise<Membership | null> => {
  const user = await getCurrentUser();
  if (!user) return null;

  const memberships = await getMemberships();
  if (STATIC_PREVIEW) {
    return resolveActiveMembership(memberships, DEMO_ACTIVE_COMPANY_ID);
  }
  const cookieStore = await cookies();
  const preferred = cookieStore.get(ACTIVE_COMPANY_COOKIE)?.value ?? null;
  return resolveActiveMembership(memberships, preferred);
});

export async function requireApprovedMembership(): Promise<Membership> {
  const membership = await getActiveMembership();
  if (!membership) throw new ForbiddenError("No company membership.");
  if (membership.companyStatus !== "APPROVED") {
    throw new ForbiddenError("This company is not approved for wholesale purchasing.");
  }
  return membership;
}

export const getMfaState = cache(async (): Promise<MfaState> => {
  if (STATIC_PREVIEW) return { currentLevel: "aal1", nextLevel: "aal1" };

  const supabase = await createSessionClient();
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error) throw error;
  return {
    currentLevel: (data.currentLevel ?? "aal1") as MfaState["currentLevel"],
    nextLevel: (data.nextLevel ?? "aal1") as MfaState["nextLevel"],
  };
});

/**
 * Staff context for the signed-in person, or null for non-staff.
 * `mfaVerified` comes from the JWT's assurance level and `mfaRequired` from
 * the database policy switch; RLS applies the same rule.
 */
export const getStaffContext = cache(async (): Promise<StaffContext | null> => {
  if (STATIC_PREVIEW) {
    if ((await getDemoAccountKey()) !== "admin") return null;
    return {
      staffUserId: DEMO_STAFF.staffUserId,
      roleCode: DEMO_STAFF.roleCode,
      roleName: DEMO_STAFF.roleName,
      mfaVerified: false,
      mfaRequired: false,
      permissions: PERMISSION_CODES,
    };
  }

  await requireUser();
  const supabase = await createSessionClient();
  const { data, error } = await supabase.rpc("current_staff_context");
  if (error) throw error;
  const row = data?.[0];
  if (!row) return null;
  return {
    staffUserId: row.staff_user_id,
    roleCode: row.role_code,
    roleName: row.role_name,
    mfaVerified: row.mfa_verified,
    mfaRequired: row.mfa_required,
    permissions: row.permissions ?? [],
  };
});

/** Staff member whose session meets the current MFA policy. */
export async function requireStaff(): Promise<StaffContext> {
  const staff = await getStaffContext();
  if (!staff) throw new ForbiddenError("Staff access only.");
  if (staff.mfaRequired && !staff.mfaVerified) throw new MfaRequiredError();
  return staff;
}

export async function requirePermission(permission: Permission): Promise<StaffContext> {
  const staff = await requireStaff();
  if (!hasPermission(staff.permissions, permission)) {
    throw new ForbiddenError(`Missing permission: ${permission}`);
  }
  return staff;
}
