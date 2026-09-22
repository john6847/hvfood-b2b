import { createAdminClient } from "@/lib/supabase/admin";
import { createSessionClient } from "@/lib/supabase/server";
import { STATIC_PREVIEW } from "@/lib/env";
import { requirePermission } from "@/modules/identity/service";
import { generateInvitationToken } from "./crypto";
import {
  wholesaleApplicationSchema,
  approveApplicationSchema,
  rejectApplicationSchema,
  type WholesaleApplicationInput,
  type ApproveApplicationInput,
  type RejectApplicationInput,
} from "./schemas";

export type ApplicationSummary = {
  id: string;
  created_at: string;
  first_name: string;
  last_name: string;
  business_name: string;
  email: string;
  phone: string;
  business_type: string;
  estimated_monthly_volume: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
  company_id: string | null;
};

export type ApplicationDetail = ApplicationSummary & {
  website: string | null;
  address: {
    street1: string;
    street2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  business_number: string | null;
  products_interested_in: string[];
  applicant_notes: string | null;
  reviewed_at: string | null;
  internal_notes: string | null;
  customer_message: string | null;
  potentialDuplicates?: Array<{
    type: "EMAIL" | "BUSINESS_NAME";
    companyName: string;
    companyId: string;
    status: string;
  }>;
};

// Mock fixtures for STATIC_PREVIEW mode
const PREVIEW_APPLICATIONS: ApplicationDetail[] = [
  {
    id: "app-preview-001",
    created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    first_name: "Marcus",
    last_name: "Bennett",
    business_name: "Bennett Bistro & Provisions",
    email: "marcus@bennettbistro.test",
    phone: "305-555-0199",
    website: "https://bennettbistro.test",
    business_type: "RESTAURANT",
    address: {
      street1: "742 Ocean Drive",
      city: "Miami Beach",
      state: "FL",
      postal_code: "33139",
      country: "US",
    },
    business_number: "FL-REST-88392",
    estimated_monthly_volume: "25 – 100 cases / month",
    products_interested_in: ["Hot Sauces", "Seasoning Blends", "Bulk Plantain Chips"],
    applicant_notes: "Looking to feature your sauces in our dinner menu and retail shelf.",
    status: "PENDING",
    company_id: null,
    reviewed_at: null,
    internal_notes: null,
    customer_message: null,
  },
  {
    id: "app-preview-002",
    created_at: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
    first_name: "Sophia",
    last_name: "Alvarez",
    business_name: "Sol Caribe Market",
    email: "purchasing@solcaribe.test",
    phone: "407-555-0122",
    website: "https://solcaribemarket.test",
    business_type: "RETAIL",
    address: {
      street1: "1200 Orange Ave",
      city: "Orlando",
      state: "FL",
      postal_code: "32801",
      country: "US",
    },
    business_number: "FL-RET-44102",
    estimated_monthly_volume: "100 – 500 cases / month",
    products_interested_in: ["Produce Cases", "Flours & Grains", "Specialty Beverages"],
    applicant_notes: "Specialty Caribbean grocer with 2 locations.",
    status: "PENDING",
    company_id: null,
    reviewed_at: null,
    internal_notes: null,
    customer_message: null,
  },
];

/**
 * Public submission of a wholesale application.
 * Anonymous applicants have no table grants, so this uses the service role
 * inside the server action to safely insert the application.
 */
export async function submitApplication(input: WholesaleApplicationInput) {
  const validated = wholesaleApplicationSchema.parse(input);

  if (STATIC_PREVIEW) {
    return { ok: true, id: "app-mock-" + Math.random().toString(36).slice(2, 8) };
  }

  const admin = createAdminClient();
  const submissionKey = validated.submissionKey ?? crypto.randomUUID();

  const { data, error } = await admin
    .from("wholesale_applications")
    .insert({
      first_name: validated.firstName,
      last_name: validated.lastName,
      business_name: validated.businessName,
      email: validated.email,
      phone: validated.phone,
      website: validated.website || null,
      business_type: validated.businessType,
      address: {
        street1: validated.street1,
        street2: validated.street2 || null,
        city: validated.city,
        state: validated.state,
        postal_code: validated.postalCode,
        country: "US",
      },
      business_number: validated.businessNumber || null,
      estimated_monthly_volume: validated.estimatedMonthlyVolume || null,
      products_interested_in: validated.productsInterestedIn,
      applicant_notes: validated.applicantNotes || null,
      submission_key: submissionKey,
    })
    .select("id")
    .single();

  if (error) {
    // If conflict on submission_key (idempotent retry), return success
    if (error.code === "23505") {
      const { data: existing } = await admin
        .from("wholesale_applications")
        .select("id")
        .eq("submission_key", submissionKey)
        .single();
      if (existing) return { ok: true, id: existing.id };
    }
    console.error("Failed to submit wholesale application:", error);
    throw new Error("Could not submit application. Please try again or contact support.");
  }

  return { ok: true, id: data.id };
}

/**
 * Lists wholesale applications for the operations review dashboard.
 */
export async function listApplications(options?: {
  status?: string;
  search?: string;
}): Promise<ApplicationSummary[]> {
  await requirePermission("applications.review");

  if (STATIC_PREVIEW) {
    let list = [...PREVIEW_APPLICATIONS];
    if (options?.status && options.status !== "ALL") {
      list = list.filter((a) => a.status === options.status);
    }
    if (options?.search) {
      const q = options.search.toLowerCase();
      list = list.filter(
        (a) =>
          a.business_name.toLowerCase().includes(q) ||
          a.email.toLowerCase().includes(q) ||
          `${a.first_name} ${a.last_name}`.toLowerCase().includes(q),
      );
    }
    return list;
  }

  const supabase = await createSessionClient();
  let query = supabase
    .from("wholesale_applications")
    .select("id, created_at, first_name, last_name, business_name, email, phone, business_type, estimated_monthly_volume, status, company_id")
    .order("created_at", { ascending: false });

  if (options?.status && options.status !== "ALL") {
    query = query.eq("status", options.status as "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED");
  }

  if (options?.search?.trim()) {
    const term = `%${options.search.trim()}%`;
    query = query.or(`business_name.ilike.${term},email.ilike.${term},first_name.ilike.${term},last_name.ilike.${term}`);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching wholesale applications:", error);
    throw new Error("Could not load applications");
  }

  return (data ?? []) as ApplicationSummary[];
}

/**
 * Gets complete application details and checks for duplicate company records.
 */
export async function getApplicationDetails(id: string): Promise<ApplicationDetail | null> {
  await requirePermission("applications.review");

  if (STATIC_PREVIEW) {
    const match = PREVIEW_APPLICATIONS.find((a) => a.id === id);
    return match ?? null;
  }

  const supabase = await createSessionClient();
  const { data, error } = await supabase
    .from("wholesale_applications")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;

  // Check potential duplicates in companies
  const admin = createAdminClient();
  const duplicates: ApplicationDetail["potentialDuplicates"] = [];

  const { data: emailMatches } = await admin
    .from("companies")
    .select("id, display_name, status")
    .ilike("email", data.email)
    .limit(3);

  emailMatches?.forEach((m) => {
    duplicates.push({
      type: "EMAIL",
      companyName: m.display_name,
      companyId: m.id,
      status: m.status,
    });
  });

  const { data: nameMatches } = await admin
    .from("companies")
    .select("id, display_name, status")
    .ilike("display_name", `%${data.business_name}%`)
    .limit(3);

  nameMatches?.forEach((m) => {
    if (!duplicates.some((d) => d.companyId === m.id)) {
      duplicates.push({
        type: "BUSINESS_NAME",
        companyName: m.display_name,
        companyId: m.id,
        status: m.status,
      });
    }
  });

  const rawAddress = (data.address as Record<string, unknown>) ?? {};

  return {
    id: data.id,
    created_at: data.created_at,
    first_name: data.first_name,
    last_name: data.last_name,
    business_name: data.business_name,
    email: data.email,
    phone: data.phone,
    website: data.website,
    business_type: data.business_type,
    address: {
      street1: String(rawAddress.street1 || ""),
      street2: rawAddress.street2 ? String(rawAddress.street2) : undefined,
      city: String(rawAddress.city || ""),
      state: String(rawAddress.state || ""),
      postal_code: String(rawAddress.postal_code || ""),
      country: String(rawAddress.country || "US"),
    },
    business_number: data.business_number,
    estimated_monthly_volume: data.estimated_monthly_volume,
    products_interested_in: data.products_interested_in ?? [],
    applicant_notes: data.applicant_notes,
    status: data.status as "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED",
    company_id: data.company_id,
    reviewed_at: data.reviewed_at,
    internal_notes: data.internal_notes,
    customer_message: data.customer_message,
    potentialDuplicates: duplicates,
  };
}

/**
 * Approves an application: creates company, default location, owner invitation.
 */
export async function approveApplication(input: ApproveApplicationInput) {
  await requirePermission("applications.review");
  const validated = approveApplicationSchema.parse(input);

  if (STATIC_PREVIEW) {
    return {
      ok: true,
      companyId: "mock-company-id",
      invitationId: "mock-invite-id",
      invitationToken: "mock-token-12345",
    };
  }

  const { token, tokenHash } = generateInvitationToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();

  const supabase = await createSessionClient();
  const { data, error } = await supabase.rpc("admin_approve_application", {
    p_application_id: validated.applicationId,
    p_pricing_tier_id: validated.pricingTierId,
    p_token_hash: tokenHash,
    p_expires_at: expiresAt,
    p_internal_notes: validated.internalNotes ?? undefined,
  });

  if (error || !data || data.length === 0) {
    console.error("admin_approve_application RPC failed:", error);
    throw new Error(error?.message || "Failed to approve application");
  }

  const result = data[0];
  if (!result) {
    throw new Error("Failed to approve application: empty result from RPC");
  }

  return {
    ok: true,
    companyId: result.company_id,
    invitationId: result.invitation_id,
    invitationToken: token,
  };
}

/**
 * Rejects an application.
 */
export async function rejectApplication(input: RejectApplicationInput) {
  await requirePermission("applications.review");
  const validated = rejectApplicationSchema.parse(input);

  if (STATIC_PREVIEW) {
    return { ok: true };
  }

  const supabase = await createSessionClient();
  const { error } = await supabase.rpc("admin_reject_application", {
    p_application_id: validated.applicationId,
    p_internal_notes: validated.internalNotes ?? undefined,
    p_customer_message: validated.customerMessage ?? undefined,
  });

  if (error) {
    console.error("admin_reject_application RPC failed:", error);
    throw new Error(error.message || "Failed to reject application");
  }

  return { ok: true };
}

/**
 * Fetches available active pricing tiers for the approval modal.
 */
export async function getPricingTiers() {
  if (STATIC_PREVIEW) {
    return [
      { id: "tier-1", code: "STANDARD", name: "Standard Retail" },
      { id: "tier-2", code: "BRONZE", name: "Bronze Wholesale" },
      { id: "tier-3", code: "SILVER", name: "Silver High Volume" },
      { id: "tier-4", code: "GOLD", name: "Gold Distributor" },
      { id: "tier-5", code: "CUSTOM", name: "Custom Terms" },
    ];
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("pricing_tiers")
    .select("id, code, name")
    .eq("active", true)
    .order("name");

  if (error) {
    console.error("Failed to load pricing tiers:", error);
    return [];
  }

  return data ?? [];
}
