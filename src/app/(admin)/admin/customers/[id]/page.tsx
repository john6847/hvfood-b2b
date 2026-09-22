import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { OrderTable } from "@/components/commerce/order-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import { PageHeading } from "@/components/ui/page-heading";
import { DefinitionList, Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { CompanyStatusPill, StatusPill } from "@/components/ui/status-pill";
import { formatDate, formatMinorUsd } from "@/lib/utils";
import { getCompanyRecord } from "@/modules/accounts/queries";
import { guardPermission } from "@/modules/identity/guards";
import { hasPermission } from "@/modules/identity/permissions";
import { listCompanyOrders } from "@/modules/orders/queries";

export const metadata: Metadata = { title: "Customer" };

/**
 * Company record: details, tier, people, addresses, locations, orders, and
 * the staff-only private notes and commerce policy. Status, tier and terms
 * changes are Phase 2 commands; this page reads only.
 */
export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const staff = await guardPermission("accounts.read");
  const { id } = await params;

  const record = await getCompanyRecord(id);
  if (!record) notFound();

  const { summary, members, addresses, locations, policy, privateDetails } = record;
  const canSeeFinance =
    hasPermission(staff.permissions, "finance.read") ||
    hasPermission(staff.permissions, "accounts.read");
  const orders = hasPermission(staff.permissions, "orders.read")
    ? await listCompanyOrders(id)
    : [];

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
        eyebrow={summary.legalName}
        title={summary.displayName}
        description={`Customer since ${formatDate(summary.createdAt)}.`}
        action={<CompanyStatusPill status={summary.status} />}
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
                  { term: "Legal name", value: summary.legalName },
                  { term: "Display name", value: summary.displayName },
                  { term: "Email", value: summary.email },
                  { term: "Phone", value: summary.phone ?? "Not provided" },
                  { term: "Website", value: summary.website ?? "Not provided" },
                  { term: "Pricing tier", value: summary.pricingTierName ?? "Unassigned" },
                  { term: "Record version", value: String(summary.version) },
                ]}
              />
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="Orders" description="Everything this company has bought." />
            {orders.length === 0 ? (
              <PanelBody>
                <EmptyState title="No orders yet" />
              </PanelBody>
            ) : (
              <OrderTable orders={orders} basePath="/admin/orders" />
            )}
          </Panel>

          <Panel>
            <PanelHeader title="Addresses" />
            <PanelBody>
              {addresses.length === 0 ? (
                <EmptyState title="No addresses on file" />
              ) : (
                <ul className="divide-y divide-border">
                  {addresses.map((a) => (
                    <li
                      key={a.id}
                      className="flex flex-wrap items-start justify-between gap-3 py-3 text-sm"
                    >
                      <div>
                        <p className="font-medium text-foreground">{a.label}</p>
                        <p className="text-foreground-muted">
                          {a.contactName}
                          {a.phone ? ` · ${a.phone}` : ""}
                        </p>
                        <p className="text-foreground-muted">
                          {a.line1}
                          {a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.region} {a.postalCode}
                        </p>
                      </div>
                      <span className="flex shrink-0 gap-1">
                        {a.isBilling ? <StatusPill tone="info">Billing</StatusPill> : null}
                        {a.isDefaultShipping ? (
                          <StatusPill tone="success">Default shipping</StatusPill>
                        ) : null}
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
              {locations.length === 0 ? (
                <EmptyState title="No delivery locations" />
              ) : (
                <ul className="divide-y divide-border">
                  {locations.map((l) => (
                    <li key={l.id} className="py-3 text-sm">
                      <p className="font-medium text-foreground">{l.name}</p>
                      <p className="text-foreground-muted">
                        {[
                          l.hasDock ? "Dock" : "No dock",
                          l.liftgateRequired ? "Liftgate required" : null,
                          l.appointmentRequired ? "Appointment required" : null,
                          l.isResidential ? "Residential" : "Commercial",
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                      {l.receivingInstructions ? (
                        <p className="mt-1 text-foreground-muted break-words">{l.receivingInstructions}</p>
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
                {members.map((m) => {
                  const name = [m.firstName, m.lastName].filter(Boolean).join(" ");
                  return (
                    <li
                      key={m.id}
                      className="flex items-center justify-between gap-3 px-4 py-3 text-sm sm:px-5"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{name || m.email}</p>
                        <p className="truncate text-xs text-foreground-muted">{m.email}</p>
                      </div>
                      <StatusPill
                        tone={m.active ? (m.role === "OWNER" ? "info" : "neutral") : "danger"}
                        className="shrink-0"
                      >
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
              {canSeeFinance && policy ? (
                <DefinitionList
                  items={[
                    {
                      term: "Payment methods",
                      value:
                        [
                          policy.allowCard ? "Card" : null,
                          policy.allowAch ? "ACH" : null,
                          policy.allowManual ? "Manual" : null,
                          policy.allowTerms ? `Net ${policy.paymentTermsDays}` : null,
                        ]
                          .filter(Boolean)
                          .join(", ") || "None",
                    },
                    { term: "Credit limit", value: formatMinorUsd(policy.creditLimitMinor) },
                    {
                      term: "Order minimum",
                      value:
                        policy.orderMinimumMinor === null
                          ? "Default"
                          : formatMinorUsd(policy.orderMinimumMinor),
                    },
                    {
                      term: "Release policy",
                      value: policy.releasePolicy.replaceAll("_", " ").toLowerCase(),
                    },
                  ]}
                />
              ) : (
                <EmptyState
                  title="No policy set"
                  description="Defaults apply until finance configures this company."
                />
              )}
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader title="Internal notes" description="Never shown to the customer." />
            <PanelBody>
              {privateDetails ? (
                <DefinitionList
                  items={[
                    { term: "Business number", value: privateDetails.businessNumber ?? "Not recorded" },
                    { term: "Tax number", value: privateDetails.taxNumber ?? "Not recorded" },
                    { term: "Notes", value: privateDetails.internalNotes ?? "" },
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
