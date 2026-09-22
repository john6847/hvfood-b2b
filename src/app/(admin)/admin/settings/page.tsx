import type { Metadata } from "next";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { Table, TableScroll, Td, Th, Tr } from "@/components/ui/data-table";
import { StatusPill } from "@/components/ui/status-pill";
import { formatDate } from "@/lib/utils";
import { staffDirectory } from "@/modules/accounts/queries";
import { hasPermission } from "@/modules/identity/permissions";
import { guardStaff } from "@/modules/identity/guards";

export const metadata: Metadata = { title: "Settings" };

const sections = [
  ["Company", "Legal entity, support contacts, brand tokens"],
  ["Wholesale", "Default tier, order minimum, application fields"],
  ["Pricing", "Rounding policy, tier defaults"],
  ["Shipping", "Regions, thresholds, package defaults, freight rules"],
  ["Integrations", "Shopify, Stripe, ShipStation, email"],
  ["Notifications", "Templates and delivery"],
  ["Security", "Session limits, reauthentication"],
];

export default async function SettingsPage() {
  const staff = await guardStaff();
  const canManageStaff = hasPermission(staff.permissions, "staff.manage");

  const directory = canManageStaff ? await staffDirectory() : [];

  return (
    <>
      <PageHeading
        eyebrow="Configuration"
        title="Settings"
        description="Business rules stay configurable here so operations does not need a developer."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <PanelHeader title="Users" description="Staff roles are assigned by an administrator." />
          {!canManageStaff ? (
            <PanelBody>
              <EmptyState title="Administrator only" description="Staff configuration needs the staff.manage permission." />
            </PanelBody>
          ) : (
            <TableScroll>
              <Table className="min-w-[480px]">
                <thead>
                  <tr>
                    <Th>Name</Th>
                    <Th>Role</Th>
                    <Th>Status</Th>
                    <Th>Added</Th>
                  </tr>
                </thead>
                <tbody>
                  {directory.map((row) => (
                    <Tr key={row.staffUserId}>
                      <Td>
                        <span className="font-medium">
                          {[row.firstName, row.lastName].filter(Boolean).join(" ") || row.email}
                        </span>
                        <span className="block text-xs text-foreground-muted">{row.email}</span>
                      </Td>
                      <Td>{row.roleName}</Td>
                      <Td>
                        <StatusPill tone={row.active ? "success" : "danger"}>
                          {row.active ? "Active" : "Inactive"}
                        </StatusPill>
                      </Td>
                      <Td className="text-foreground-muted">{formatDate(row.createdAt)}</Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </TableScroll>
          )}
        </Panel>

        <Panel>
          <PanelHeader title="Sections" description="Each opens with the phase that needs it." />
          <PanelBody className="p-0">
            <ul className="divide-y divide-border">
              {sections.map(([name, detail]) => (
                <li key={name} className="px-4 py-3 text-sm sm:px-5">
                  <p className="font-medium text-foreground">{name}</p>
                  <p className="text-xs text-foreground-muted">{detail}</p>
                </li>
              ))}
            </ul>
          </PanelBody>
        </Panel>
      </div>
    </>
  );
}
