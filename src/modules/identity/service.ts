import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import type { User } from "@supabase/supabase-js";
import { createSessionClient } from "@/lib/supabase/server";
import {
  ForbiddenError,
  MfaRequiredError,
  UnauthenticatedError,
} from "@/lib/errors";
import {
  resolveActiveMembership,
  type CompanyRole,
  type CompanyStatus,
  type Membership,
} from "./company-access";
import { hasPermission, type Permission } from "./permissions";

/**
 * Identity module: the only place server code asks "who is this and what
 * may they do". Everything is derived from the verified session and the
 * database, never from client-supplied ids or user metadata.
 */

export const ACTIVE_COMPANY_COOKIE = "hv_company";

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
  /** Assurance level of the current session. */
  currentLevel: "aal1" | "aal2";
  /** Highest level the user can reach: aal2 means a factor is enrolled. */
  nextLevel: "aal1" | "aal2";
};

export const getCurrentUser = cache(async (): Promise<User | null> => {
  const supabase = await createSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new UnauthenticatedError();
  return user;
}

export const getProfile = cache(async () => {
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

/** Every active membership for the signed-in person, ordered by company. */
export const getMemberships = cache(async (): Promise<Membership[]> => {
  await requireUser();
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
  const memberships = await getMemberships();
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
