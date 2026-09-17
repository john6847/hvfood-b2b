import type { Metadata } from "next";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import { PageHeading } from "@/components/ui/page-heading";
import { DefinitionList, Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { Table, TableScroll, Td, Th, Tr } from "@/components/ui/data-table";
import { CompanyStatusPill, StatusPill } from "@/components/ui/status-pill";
import { createSessionClient } from "@/lib/supabase/server";
import { canManageCompany } from "@/modules/identity/company-access";
import { getActiveMembership } from "@/modules/identity/service";

export const metadata: Metadata = { title: "Account" };

const roleLabel: Record<string, string> = {
  OWNER: "Owner",
  BUYER: "Buyer",
  VIEWER: "Viewer",
};

/**
 * Company record as the member is allowed to see it. Every query runs
 * through the session client, so RLS decides which rows come back.
 * Editing (owner only) ships with the accounts phase.
 */
export default async function AccountPage() {
  const membership = await getActiveMembership();

  if (!membership) {
    return (
      <>
        <PageHeading eyebrow="Account" title="No company linked" />
        <Notice tone="info">This sign-in is not a member of any wholesale company yet.</Notice>
      </>
    );
  }

  const supabase = await createSessionClient();
  const companyId = membership.companyId;

  const [companyResult, membersResult, addressesResult, locationsResult] = await Promise.all([
    supabase
      .from("companies")
      .select("id, legal_name, display_name, email, phone, website, status, currency, created_at")
      .eq("id", companyId)
      .maybeSingle(),
    supabase
      .from("company_users")
      .select("id, role, active, user_id, profiles(first_name, last_name, email)")
      .eq("company_id", companyId)
      .eq("active", true),
    supabase
      .from("company_addresses")
      .select("id, label, contact_name, phone, line1, line2, city, region, postal_code, is_billing, is_default_shipping")
      .eq("company_id", companyId)
      .is("archived_at", null)
      .order("label"),
    supabase
      .from("company_locations")
      .select("id, name, has_dock, liftgate_required, appointment_required, is_residential, receiving_instructions, active, address_id")
      .eq("company_id", companyId)
      .eq("active", true)
      .order("name"),
  ]);

  const company = companyResult.data;
  const members = membersResult.data ?? [];
  const addresses = addressesResult.data ?? [];
  const locations = locationsResult.data ?? [];
  const owner = canManageCompany(membership);

  return (
    <>
      <PageHeading
        eyebrow="Account"
        title={company?.display_name ?? membership.companyDisplayName}
        description={owner ? "You manage this company." : `You are a ${roleLabel[membership.role]?.toLowerCase()} on this company.`}
        action={<CompanyStatusPill status={membership.companyStatus} />}
      />

      {owner ? (
        <Notice tone="info" className="mb-6">
          Editing company details, addresses and inviting employees opens with the accounts
          release. For changes now, contact the wholesale team.
        </Notice>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <PanelHeader title="Company details" />
          <PanelBody>
            <DefinitionList
              items={[
                { term: "Legal name", value: company?.legal_name ?? "" },
                { term: "Display name", value: company?.display_name ?? "" },
                { term: "Email", value: company?.email ?? "" },
                { term: "Phone", value: company?.phone ?? "Not provided" },
                {
                  term: "Website",
                  value: company?.website ? (
                    <a href={company.website} className="text-primary underline underline-offset-4">
                      {company.website}
                    </a>
                  ) : (
                    "Not provided"
                  ),
                },
                { term: "Currency", value: company?.currency ?? "USD" },
              ]}
            />
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader
            title="People"
            description={owner ? "Everyone with access to this company." : "Your access."}
          />
          <PanelBody className="p-0">
            <ul className="divide-y divide-border">
              {members.map((m) => {
                const profile = m.profiles;
                const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ");
                return (
                  <li key={m.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {name || profile?.email || "Member"}
                      </p>
                      {name && profile?.email ? (
                        <p className="truncate text-xs text-foreground-muted">{profile.email}</p>
                      ) : null}
                    </div>
                    <StatusPill tone={m.role === "OWNER" ? "info" : "neutral"}>
                      {roleLabel[m.role] ?? m.role}
                    </StatusPill>
                  </li>
                );
              })}
            </ul>
          </PanelBody>
        </Panel>
      </div>

      <Panel className="mt-6">
        <PanelHeader title="Addresses" description="Billing and shipping addresses on file." />
        {addresses.length === 0 ? (
          <PanelBody>
            <EmptyState
              title="No addresses yet"
              description="Delivery and billing addresses are added during account setup."
            />
          </PanelBody>
        ) : (
          <TableScroll>
            <Table>
              <thead>
                <tr>
                  <Th>Label</Th>
                  <Th>Contact</Th>
                  <Th>Address</Th>
                  <Th>Use</Th>
                </tr>
              </thead>
              <tbody>
                {addresses.map((a) => (
                  <Tr key={a.id}>
                    <Td className="font-medium">{a.label}</Td>
                    <Td>
                      {a.contact_name}
                      {a.phone ? <span className="block text-xs text-foreground-muted">{a.phone}</span> : null}
                    </Td>
                    <Td>
                      {a.line1}
                      {a.line2 ? `, ${a.line2}` : ""}
                      <span className="block text-xs text-foreground-muted">
                        {a.city}, {a.region} {a.postal_code}
                      </span>
                    </Td>
                    <Td>
                      <span className="flex flex-wrap gap-1">
                        {a.is_billing ? <StatusPill tone="info">Billing</StatusPill> : null}
                        {a.is_default_shipping ? <StatusPill tone="success">Default shipping</StatusPill> : null}
                      </span>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </TableScroll>
        )}
      </Panel>

      <Panel className="mt-6">
        <PanelHeader
          title="Delivery locations"
          description="Receiving requirements used when quoting shipping."
        />
        {locations.length === 0 ? (
          <PanelBody>
            <EmptyState
              title="No delivery locations yet"
              description="A location pairs an address with dock, liftgate and appointment details."
            />
          </PanelBody>
        ) : (
          <TableScroll>
            <Table>
              <thead>
                <tr>
                  <Th>Location</Th>
                  <Th>Address</Th>
                  <Th>Receiving</Th>
                  <Th>Instructions</Th>
                </tr>
              </thead>
              <tbody>
                {locations.map((l) => {
                  const address = addresses.find((a) => a.id === l.address_id);
                  const flags = [
                    l.has_dock ? "Dock" : null,
                    l.liftgate_required ? "Liftgate" : null,
                    l.appointment_required ? "Appointment" : null,
                    l.is_residential ? "Residential" : null,
                  ].filter(Boolean);
                  return (
                    <Tr key={l.id}>
                      <Td className="font-medium">{l.name}</Td>
                      <Td>{address ? `${address.line1}, ${address.city} ${address.region}` : "Address"}</Td>
                      <Td>{flags.length ? flags.join(" · ") : "Standard"}</Td>
                      <Td className="whitespace-normal text-foreground-muted">
                        {l.receiving_instructions ?? ""}
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
          </TableScroll>
        )}
      </Panel>
    </>
  );
}
