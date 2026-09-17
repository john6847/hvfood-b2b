import "server-only";
import { STATIC_PREVIEW } from "@/lib/env";
import { createSessionClient } from "@/lib/supabase/server";
import {
  DEMO_APPLICATIONS,
  DEMO_COMPANY_RECORDS,
  DEMO_COMPANY_SUMMARIES,
  DEMO_STAFF_DIRECTORY,
} from "@/modules/demo/fixtures";
import type {
  CompanyRecord,
  CompanyStatus,
  CompanySummary,
  StaffMember,
  WholesaleApplication,
} from "./types";

/**
 * Account reads. Each function has one Supabase path and one static-preview
 * path, so pages never branch on where the data comes from.
 *
 * Authorization is unchanged on the Supabase path: reads go through the
 * session client, so RLS decides which rows come back, and the staff
 * projections re-check permissions in the database.
 */

export async function listCompanies(): Promise<CompanySummary[]> {
  if (STATIC_PREVIEW) return DEMO_COMPANY_SUMMARIES;

  const supabase = await createSessionClient();
  const { data, error } = await supabase.rpc("admin_companies");
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    legalName: row.legal_name,
    displayName: row.display_name,
    email: row.email,
    phone: row.phone,
    website: row.website,
    status: row.status as CompanyStatus,
    pricingTierCode: row.pricing_tier_code,
    pricingTierName: row.pricing_tier_name,
    memberCount: Number(row.member_count),
    createdAt: row.created_at,
    version: Number(row.version),
  }));
}

export async function companyCounts(): Promise<Record<string, number>> {
  if (STATIC_PREVIEW) {
    const counts: Record<string, number> = {};
    for (const c of DEMO_COMPANY_SUMMARIES) counts[c.status] = (counts[c.status] ?? 0) + 1;
    return counts;
  }

  const supabase = await createSessionClient();
  const { data, error } = await supabase.rpc("admin_company_counts");
  if (error) throw error;
  const counts: Record<string, number> = {};
  for (const row of data ?? []) counts[row.status] = Number(row.total);
  return counts;
}

/** Full record for the admin customer page. Null when not visible. */
export async function getCompanyRecord(companyId: string): Promise<CompanyRecord | null> {
  if (STATIC_PREVIEW) return DEMO_COMPANY_RECORDS[companyId] ?? null;

  const supabase = await createSessionClient();
  const [companies, members, addresses, locations, policy, privateDetails] = await Promise.all([
    listCompanies(),
    supabase
      .from("company_users")
      .select("id, role, active, profiles(first_name, last_name, email)")
      .eq("company_id", companyId)
      .order("created_at"),
    supabase.from("company_addresses").select("*").eq("company_id", companyId).is("archived_at", null),
    supabase.from("company_locations").select("*").eq("company_id", companyId).eq("active", true),
    supabase.from("company_commerce_policies").select("*").eq("company_id", companyId).maybeSingle(),
    supabase.from("company_private_details").select("*").eq("company_id", companyId).maybeSingle(),
  ]);

  const summary = companies.find((c) => c.id === companyId);
  if (!summary) return null;

  return {
    summary,
    members: (members.data ?? []).map((m) => ({
      id: m.id,
      role: m.role as CompanyRecord["members"][number]["role"],
      active: m.active,
      firstName: m.profiles?.first_name ?? "",
      lastName: m.profiles?.last_name ?? "",
      email: m.profiles?.email ?? "",
    })),
    addresses: (addresses.data ?? []).map((a) => ({
      id: a.id,
      label: a.label,
      contactName: a.contact_name,
      phone: a.phone,
      line1: a.line1,
      line2: a.line2,
      city: a.city,
      region: a.region,
      postalCode: a.postal_code,
      isBilling: a.is_billing,
      isDefaultShipping: a.is_default_shipping,
    })),
    locations: (locations.data ?? []).map((l) => ({
      id: l.id,
      addressId: l.address_id,
      name: l.name,
      isResidential: l.is_residential,
      hasDock: l.has_dock,
      liftgateRequired: l.liftgate_required,
      appointmentRequired: l.appointment_required,
      receivingInstructions: l.receiving_instructions,
    })),
    policy: policy.data
      ? {
          paymentTermsDays: policy.data.payment_terms_days,
          creditLimitMinor: Number(policy.data.credit_limit_minor),
          orderMinimumMinor:
            policy.data.order_minimum_minor === null ? null : Number(policy.data.order_minimum_minor),
          allowCard: policy.data.allow_card,
          allowAch: policy.data.allow_ach,
          allowManual: policy.data.allow_manual,
          allowTerms: policy.data.allow_terms,
          releasePolicy: policy.data.release_policy,
        }
      : null,
    privateDetails: privateDetails.data
      ? {
          businessNumber: privateDetails.data.business_number,
          taxNumber: privateDetails.data.tax_number,
          internalNotes: privateDetails.data.internal_notes,
        }
      : null,
  };
}

/**
 * The company record as one of its own members may see it: no tier, no
 * private notes, no commerce policy.
 */
export async function getMemberCompanyRecord(companyId: string): Promise<CompanyRecord | null> {
  if (STATIC_PREVIEW) {
    const record = DEMO_COMPANY_RECORDS[companyId];
    if (!record) return null;
    return { ...record, policy: null, privateDetails: null };
  }

  const supabase = await createSessionClient();
  const [company, members, addresses, locations] = await Promise.all([
    supabase
      .from("companies")
      .select("id, legal_name, display_name, email, phone, website, status, currency, created_at, version")
      .eq("id", companyId)
      .maybeSingle(),
    supabase
      .from("company_users")
      .select("id, role, active, profiles(first_name, last_name, email)")
      .eq("company_id", companyId)
      .eq("active", true),
    supabase
      .from("company_addresses")
      .select("*")
      .eq("company_id", companyId)
      .is("archived_at", null)
      .order("label"),
    supabase
      .from("company_locations")
      .select("*")
      .eq("company_id", companyId)
      .eq("active", true)
      .order("name"),
  ]);

  if (!company.data) return null;

  return {
    summary: {
      id: company.data.id,
      legalName: company.data.legal_name,
      displayName: company.data.display_name,
      email: company.data.email,
      phone: company.data.phone,
      website: company.data.website,
      status: company.data.status as CompanyStatus,
      pricingTierCode: null,
      pricingTierName: null,
      memberCount: (members.data ?? []).length,
      createdAt: company.data.created_at,
      version: Number(company.data.version),
    },
    members: (members.data ?? []).map((m) => ({
      id: m.id,
      role: m.role as CompanyRecord["members"][number]["role"],
      active: m.active,
      firstName: m.profiles?.first_name ?? "",
      lastName: m.profiles?.last_name ?? "",
      email: m.profiles?.email ?? "",
    })),
    addresses: (addresses.data ?? []).map((a) => ({
      id: a.id,
      label: a.label,
      contactName: a.contact_name,
      phone: a.phone,
      line1: a.line1,
      line2: a.line2,
      city: a.city,
      region: a.region,
      postalCode: a.postal_code,
      isBilling: a.is_billing,
      isDefaultShipping: a.is_default_shipping,
    })),
    locations: (locations.data ?? []).map((l) => ({
      id: l.id,
      addressId: l.address_id,
      name: l.name,
      isResidential: l.is_residential,
      hasDock: l.has_dock,
      liftgateRequired: l.liftgate_required,
      appointmentRequired: l.appointment_required,
      receivingInstructions: l.receiving_instructions,
    })),
    policy: null,
    privateDetails: null,
  };
}

export async function staffDirectory(): Promise<StaffMember[]> {
  if (STATIC_PREVIEW) return DEMO_STAFF_DIRECTORY;

  const supabase = await createSessionClient();
  const { data, error } = await supabase.rpc("admin_staff_directory");
  if (error) throw error;
  return (data ?? []).map((row) => ({
    staffUserId: row.staff_user_id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    roleName: row.role_name,
    active: row.active,
    createdAt: row.created_at,
  }));
}

/** Applications land in Phase 2. Static preview shows a sample queue. */
export async function pendingApplications(): Promise<WholesaleApplication[]> {
  if (STATIC_PREVIEW) return DEMO_APPLICATIONS;
  return [];
}
