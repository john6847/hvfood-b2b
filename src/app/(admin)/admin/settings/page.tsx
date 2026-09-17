import type { Metadata } from "next";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { Table, TableScroll, Td, Th, Tr } from "@/components/ui/data-table";
import { StatusPill } from "@/components/ui/status-pill";
import { createSessionClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
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

  const supabase = await createSessionClient();
  const directory = canManageStaff ? await supabase.rpc("admin_staff_directory") : null;

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
          ) : directory?.error ? (
            <PanelBody>
              <EmptyState title="Could not load staff" description={directory.error.message} />
            </PanelBody>
          ) : (
            <TableScroll>
              <Table>
                <thead>
                  <tr>
                    <Th>Name</Th>
                    <Th>Role</Th>
                    <Th>Status</Th>
                    <Th>Added</Th>
                  </tr>
                </thead>
                <tbody>
                  {(directory?.data ?? []).map((row) => (
                    <Tr key={row.staff_user_id}>
                      <Td>
                        <span className="font-medium">
                          {[row.first_name, row.last_name].filter(Boolean).join(" ") || row.email}
                        </span>
                        <span className="block text-xs text-foreground-muted">{row.email}</span>
                      </Td>
                      <Td>{row.role_name}</Td>
                      <Td>
                        <StatusPill tone={row.active ? "success" : "danger"}>
                          {row.active ? "Active" : "Inactive"}
                        </StatusPill>
                      </Td>
                      <Td className="text-foreground-muted">{formatDate(row.created_at)}</Td>
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
                <li key={name} className="px-5 py-3 text-sm">
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
