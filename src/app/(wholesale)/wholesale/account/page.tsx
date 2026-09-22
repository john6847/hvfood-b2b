import type { Metadata } from "next";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import { PageHeading } from "@/components/ui/page-heading";
import { DefinitionList, Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { Table, TableScroll, Td, Th, Tr } from "@/components/ui/data-table";
import { CompanyStatusPill, StatusPill } from "@/components/ui/status-pill";
import { getMemberCompanyRecord } from "@/modules/accounts/queries";
import { canManageCompany } from "@/modules/identity/company-access";
import { getActiveMembership } from "@/modules/identity/service";

export const metadata: Metadata = { title: "Account" };

const roleLabel: Record<string, string> = {
  OWNER: "Owner",
  BUYER: "Buyer",
  VIEWER: "Viewer",
};

/**
 * The company record as the member is allowed to see it. On the connected
 * path every query runs through the session client, so RLS decides which
 * rows come back. Editing (owner only) ships with the accounts phase.
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

  const record = await getMemberCompanyRecord(membership.companyId);
  const owner = canManageCompany(membership);

  return (
    <>
      <PageHeading
        eyebrow="Account"
        title={record?.summary.displayName ?? membership.companyDisplayName}
        description={
          owner
            ? "You manage this company."
            : `You are a ${roleLabel[membership.role]?.toLowerCase()} on this company.`
        }
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
                { term: "Legal name", value: record?.summary.legalName ?? "" },
                { term: "Display name", value: record?.summary.displayName ?? "" },
                { term: "Email", value: record?.summary.email ?? "" },
                { term: "Phone", value: record?.summary.phone ?? "Not provided" },
                {
                  term: "Website",
                  value: record?.summary.website ? (
                    <a
                      href={record.summary.website}
                      className="text-primary underline underline-offset-4"
                    >
                      {record.summary.website}
                    </a>
                  ) : (
                    "Not provided"
                  ),
                },
                { term: "Currency", value: "USD" },
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
              {(record?.members ?? []).map((m) => {
                const name = [m.firstName, m.lastName].filter(Boolean).join(" ");
                return (
                  <li key={m.id} className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {name || m.email}
                      </p>
                      {name && m.email ? (
                        <p className="truncate text-xs text-foreground-muted">{m.email}</p>
                      ) : null}
                    </div>
                    <StatusPill tone={m.role === "OWNER" ? "info" : "neutral"} className="shrink-0">
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
        {(record?.addresses ?? []).length === 0 ? (
          <PanelBody>
            <EmptyState
              title="No addresses yet"
              description="Delivery and billing addresses are added during account setup."
            />
          </PanelBody>
        ) : (
          <TableScroll>
            <Table className="min-w-[500px]">
              <thead>
                <tr>
                  <Th>Label</Th>
                  <Th>Contact</Th>
                  <Th>Address</Th>
                  <Th>Use</Th>
                </tr>
              </thead>
              <tbody>
                {(record?.addresses ?? []).map((a) => (
                  <Tr key={a.id}>
                    <Td className="font-medium">{a.label}</Td>
                    <Td>
                      {a.contactName}
                      {a.phone ? (
                        <span className="block text-xs text-foreground-muted">{a.phone}</span>
                      ) : null}
                    </Td>
                    <Td>
                      {a.line1}
                      {a.line2 ? `, ${a.line2}` : ""}
                      <span className="block text-xs text-foreground-muted">
                        {a.city}, {a.region} {a.postalCode}
                      </span>
                    </Td>
                    <Td>
                      <span className="flex flex-wrap gap-1">
                        {a.isBilling ? <StatusPill tone="info">Billing</StatusPill> : null}
                        {a.isDefaultShipping ? (
                          <StatusPill tone="success">Default shipping</StatusPill>
                        ) : null}
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
        {(record?.locations ?? []).length === 0 ? (
          <PanelBody>
            <EmptyState
              title="No delivery locations yet"
              description="A location pairs an address with dock, liftgate and appointment details."
            />
          </PanelBody>
        ) : (
          <TableScroll>
            <Table className="min-w-[500px]">
              <thead>
                <tr>
                  <Th>Location</Th>
                  <Th>Address</Th>
                  <Th>Receiving</Th>
                  <Th>Instructions</Th>
                </tr>
              </thead>
              <tbody>
                {(record?.locations ?? []).map((l) => {
                  const address = record?.addresses.find((a) => a.id === l.addressId);
                  const flags = [
                    l.hasDock ? "Dock" : null,
                    l.liftgateRequired ? "Liftgate" : null,
                    l.appointmentRequired ? "Appointment" : null,
                    l.isResidential ? "Residential" : null,
                  ].filter(Boolean);
                  return (
                    <Tr key={l.id}>
                      <Td className="font-medium">{l.name}</Td>
                      <Td>
                        {address ? `${address.line1}, ${address.city} ${address.region}` : "Address"}
                      </Td>
                      <Td>{flags.length ? flags.join(" · ") : "Standard"}</Td>
                      <Td className="whitespace-normal text-foreground-muted">
                        {l.receivingInstructions ?? ""}
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
