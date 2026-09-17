import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import { PageHeading } from "@/components/ui/page-heading";
import { DefinitionList, Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { CompanyStatusPill, StatusPill } from "@/components/ui/status-pill";
import { createSessionClient } from "@/lib/supabase/server";
import { formatDate, formatMinorUsd } from "@/lib/utils";
import { hasPermission } from "@/modules/identity/permissions";
import { guardPermission } from "@/modules/identity/guards";

export const metadata: Metadata = { title: "Customer" };

/**
 * Company record page: details, tier, people, addresses, locations, and
 * the staff-only private details and commerce policy. Status, tier and
 * terms changes are Phase 2 commands; this page reads only.
 */
export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const staff = await guardPermission("accounts.read");
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const supabase = await createSessionClient();
  const [overview, members, privateDetails, policy, addresses, locations] = await Promise.all([
    supabase.rpc("admin_companies"),
    supabase
      .from("company_users")
      .select("id, role, active, created_at, profiles(first_name, last_name, email)")
      .eq("company_id", id)
      .order("created_at"),
    supabase.from("company_private_details").select("*").eq("company_id", id).maybeSingle(),
    hasPermission(staff.permissions, "finance.read") || hasPermission(staff.permissions, "accounts.read")
      ? supabase.from("company_commerce_policies").select("*").eq("company_id", id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("company_addresses").select("*").eq("company_id", id).is("archived_at", null),
    supabase.from("company_locations").select("*").eq("company_id", id),
  ]);

  const company = (overview.data ?? []).find((row) => row.id === id);
  if (!company) notFound();

  return (
    <>
      <Link
        href="/admin/customers"
        className="mb-4 inline-flex items-center gap-1 text-xs text-foreground-muted hover:text-foreground"
      >
        <ArrowLeft className="size-3" aria-hidden />
        Customers
      </Link>
      <PageHeading
        eyebrow={company.legal_name}
        title={company.display_name}
        description={`Customer since ${formatDate(company.created_at)}.`}
        action={<CompanyStatusPill status={company.status} />}
      />

      <Notice tone="info" className="mb-6">
        Approve, suspend, change tier and edit terms arrive with the accounts release. Those
        commands run server-side with permission checks and an audit record.
      </Notice>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Panel>
            <PanelHeader title="Company" />
            <PanelBody>
              <DefinitionList
                items={[
                  { term: "Legal name", value: company.legal_name },
                  { term: "Display name", value: company.display_name },
                  { term: "Email", value: company.email },
                  { term: "Phone", value: company.phone ?? "Not provided" },
                  { term: "Website", value: company.website ?? "Not provided" },
                  { term: "Pricing tier", value: company.pricing_tier_name ?? "Unassigned" },
                  { term: "Record version", value: String(company.version) },
                ]}
              />
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="Addresses" />
            <PanelBody>
              {(addresses.data ?? []).length === 0 ? (
                <EmptyState title="No addresses on file" />
              ) : (
                <ul className="divide-y divide-border">
                  {(addresses.data ?? []).map((a) => (
                    <li key={a.id} className="flex flex-wrap items-start justify-between gap-3 py-3 text-sm">
                      <div>
                        <p className="font-medium text-foreground">{a.label}</p>
                        <p className="text-foreground-muted">
                          {a.contact_name}
                          {a.phone ? ` · ${a.phone}` : ""}
                        </p>
                        <p className="text-foreground-muted">
                          {a.line1}
                          {a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.region} {a.postal_code}
                        </p>
                      </div>
                      <span className="flex gap-1">
                        {a.is_billing ? <StatusPill tone="info">Billing</StatusPill> : null}
                        {a.is_default_shipping ? <StatusPill tone="success">Default shipping</StatusPill> : null}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="Delivery locations" />
            <PanelBody>
              {(locations.data ?? []).length === 0 ? (
                <EmptyState title="No delivery locations" />
              ) : (
                <ul className="divide-y divide-border">
                  {(locations.data ?? []).map((l) => (
                    <li key={l.id} className="py-3 text-sm">
                      <p className="font-medium text-foreground">{l.name}</p>
                      <p className="text-foreground-muted">
                        {[
                          l.has_dock ? "Dock" : "No dock",
                          l.liftgate_required ? "Liftgate required" : null,
                          l.appointment_required ? "Appointment required" : null,
                          l.is_residential ? "Residential" : "Commercial",
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                      {l.receiving_instructions ? (
                        <p className="mt-1 text-foreground-muted">{l.receiving_instructions}</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </PanelBody>
          </Panel>
        </div>

        <div className="flex flex-col gap-6">
          <Panel>
            <PanelHeader title="People" />
            <PanelBody className="p-0">
              <ul className="divide-y divide-border">
                {(members.data ?? []).map((m) => {
                  const name = [m.profiles?.first_name, m.profiles?.last_name].filter(Boolean).join(" ");
                  return (
                    <li key={m.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{name || m.profiles?.email}</p>
                        <p className="truncate text-xs text-foreground-muted">{m.profiles?.email}</p>
                      </div>
                      <StatusPill tone={m.active ? (m.role === "OWNER" ? "info" : "neutral") : "danger"}>
                        {m.active ? m.role.toLowerCase() : "inactive"}
                      </StatusPill>
                    </li>
                  );
                })}
              </ul>
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="Commerce policy" description="Payment methods and terms." />
            <PanelBody>
              {policy.data ? (
                <DefinitionList
                  items={[
                    {
                      term: "Payment methods",
                      value: [
                        policy.data.allow_card ? "Card" : null,
                        policy.data.allow_ach ? "ACH" : null,
                        policy.data.allow_manual ? "Manual" : null,
                        policy.data.allow_terms ? `Net ${policy.data.payment_terms_days}` : null,
                      ]
                        .filter(Boolean)
                        .join(", ") || "None",
                    },
                    { term: "Credit limit", value: formatMinorUsd(policy.data.credit_limit_minor) },
                    {
                      term: "Order minimum",
                      value:
                        policy.data.order_minimum_minor === null
                          ? "Default"
                          : formatMinorUsd(policy.data.order_minimum_minor),
                    },
                    { term: "Release policy", value: policy.data.release_policy.replaceAll("_", " ").toLowerCase() },
                  ]}
                />
              ) : (
                <EmptyState title="No policy set" description="Defaults apply until finance configures this company." />
              )}
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="Internal notes" description="Never shown to the customer." />
            <PanelBody>
              {privateDetails.data ? (
                <DefinitionList
                  items={[
                    { term: "Business number", value: privateDetails.data.business_number ?? "Not recorded" },
                    { term: "Tax number", value: privateDetails.data.tax_number ?? "Not recorded" },
                    { term: "Notes", value: privateDetails.data.internal_notes ?? "" },
                  ]}
                />
              ) : (
                <EmptyState title="No private details recorded" />
              )}
            </PanelBody>
          </Panel>
        </div>
      </div>
    </>
  );
}
