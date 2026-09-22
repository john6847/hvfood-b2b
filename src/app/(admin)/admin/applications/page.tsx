import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, FileText } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel } from "@/components/ui/panel";
import { Table, TableScroll, Td, Th, Tr } from "@/components/ui/data-table";
import { StatusPill } from "@/components/ui/status-pill";
import { cn, formatDate } from "@/lib/utils";
import { listApplications } from "@/modules/accounts/application-service";
import { guardPermission } from "@/modules/identity/guards";

export const metadata: Metadata = { title: "Wholesale Applications" };

const STATUSES = ["ALL", "PENDING", "APPROVED", "REJECTED"] as const;
type StatusFilter = (typeof STATUSES)[number];

const statusTone: Record<string, "warning" | "success" | "danger" | "neutral"> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "danger",
  SUSPENDED: "neutral",
};

export default async function AdminApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  await guardPermission("applications.review");
  const params = await searchParams;
  const status: StatusFilter = STATUSES.includes(params.status as StatusFilter)
    ? (params.status as StatusFilter)
    : "ALL";
  const query = (params.q ?? "").trim();

  const applications = await listApplications({
    status: status === "ALL" ? undefined : status,
    search: query || undefined,
  });

  return (
    <>
      <PageHeading
        eyebrow="Onboarding"
        title="Wholesale Applications"
        description="Review inbound business applications, evaluate volume, and approve or reject wholesale accounts."
      />

      <Panel>
        <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <nav aria-label="Status filter" className="flex flex-wrap gap-1">
            {STATUSES.map((value) => {
              const href =
                value === "ALL" ? "/admin/applications" : `/admin/applications?status=${value}`;
              const current = status === value;
              return (
                <Link
                  key={value}
                  href={href}
                  aria-current={current ? "page" : undefined}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                    current
                      ? "bg-muted text-foreground font-semibold"
                      : "text-foreground-muted hover:text-foreground",
                  )}
                >
                  {value === "ALL" ? "All" : value[0] + value.slice(1).toLowerCase()}
                </Link>
              );
            })}
          </nav>

          <form method="get" className="flex items-center gap-2">
            {status !== "ALL" && <input type="hidden" name="status" value={status} />}
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Search business, name, or email..."
              className="h-8 w-full sm:w-64 rounded-md border border-border bg-surface px-2.5 text-xs text-foreground placeholder:text-foreground-subtle focus-visible:border-border-strong"
            />
          </form>
        </div>

        {applications.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-6 w-6" />}
            title="No applications found"
            description={
              query
                ? `No applications matching "${query}".`
                : status === "PENDING"
                ? "No applications currently pending review."
                : "No applications found in this view."
            }
          />
        ) : (
          <TableScroll>
            <Table>
              <thead>
                <Tr>
                  <Th>Business Name</Th>
                  <Th>Applicant</Th>
                  <Th>Type</Th>
                  <Th>Monthly Volume</Th>
                  <Th>Status</Th>
                  <Th>Submitted</Th>
                  <Th className="text-right">Action</Th>
                </Tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <Tr key={app.id}>
                    <Td className="font-medium text-foreground">
                      <Link
                        href={`/admin/applications/${app.id}`}
                        className="hover:underline flex items-center gap-1.5"
                      >
                        {app.business_name}
                      </Link>
                    </Td>
                    <Td>
                      <div className="text-foreground">
                        {app.first_name} {app.last_name}
                      </div>
                      <div className="text-2xs text-foreground-muted font-mono">{app.email}</div>
                    </Td>
                    <Td className="text-xs text-foreground-muted capitalize">
                      {app.business_type.toLowerCase().replace("_", " ")}
                    </Td>
                    <Td className="text-xs text-foreground-muted">
                      {app.estimated_monthly_volume || "—"}
                    </Td>
                    <Td>
                      <StatusPill tone={statusTone[app.status] ?? "neutral"}>
                        {app.status}
                      </StatusPill>
                    </Td>
                    <Td className="text-xs text-foreground-muted">
                      {formatDate(app.created_at)}
                    </Td>
                    <Td className="text-right">
                      <Link
                        href={`/admin/applications/${app.id}`}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                      >
                        Review
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </TableScroll>
        )}
      </Panel>
    </>
  );
}
