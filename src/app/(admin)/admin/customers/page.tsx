import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel } from "@/components/ui/panel";
import { Table, TableScroll, Td, Th, Tr } from "@/components/ui/data-table";
import { CompanyStatusPill } from "@/components/ui/status-pill";
import { cn, formatDate } from "@/lib/utils";
import { listCompanies } from "@/modules/accounts/queries";
import { guardPermission } from "@/modules/identity/guards";

export const metadata: Metadata = { title: "Customers" };

const STATUSES = ["ALL", "APPROVED", "PENDING", "SUSPENDED", "REJECTED"] as const;
type StatusFilter = (typeof STATUSES)[number];

/** URL-backed status filter so views are shareable, per the blueprint. */
export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  await guardPermission("accounts.read");
  const params = await searchParams;
  const status: StatusFilter = STATUSES.includes(params.status as StatusFilter)
    ? (params.status as StatusFilter)
    : "ALL";
  const query = (params.q ?? "").trim().toLowerCase();

  const companies = await listCompanies();
  const rows = companies.filter((row) => {
    if (status !== "ALL" && row.status !== status) return false;
    if (query) {
      const haystack = `${row.displayName} ${row.legalName} ${row.email}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });

  return (
    <>
      <PageHeading
        eyebrow="Accounts"
        title="Customers"
        description="Every wholesale company, its status, tier and people."
      />

      <Panel>
        <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <nav aria-label="Status filter" className="flex flex-wrap gap-1">
            {STATUSES.map((value) => {
              const href =
                value === "ALL" ? "/admin/customers" : `/admin/customers?status=${value}`;
              const current = status === value;
              return (
                <Link
                  key={value}
                  href={href}
                  aria-current={current ? "page" : undefined}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-medium sm:px-3 sm:py-1.5",
                    current ? "bg-accent text-primary font-semibold" : "text-foreground-muted hover:bg-muted",
                  )}
                >
                  {value === "ALL" ? "All" : value.charAt(0) + value.slice(1).toLowerCase()}
                </Link>
              );
            })}
          </nav>
          <form method="get" className="flex w-full items-center gap-2 sm:w-auto">
            {status !== "ALL" ? <input type="hidden" name="status" value={status} /> : null}
            <label htmlFor="q" className="sr-only">
              Search customers
            </label>
            <input
              id="q"
              name="q"
              type="search"
              defaultValue={params.q ?? ""}
              placeholder="Search name or email"
              className="h-8 w-full rounded-md border border-border bg-surface px-2 text-xs sm:w-56 sm:text-sm"
            />
          </form>
        </div>

        {rows.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="No customers match"
              description={
                query || status !== "ALL"
                  ? "Try a different status or search term."
                  : "Approved applications create companies here."
              }
            />
          </div>
        ) : (
          <TableScroll>
            <Table className="min-w-[560px]">
              <thead>
                <tr>
                  <Th>Company</Th>
                  <Th>Status</Th>
                  <Th>Tier</Th>
                  <Th className="text-right">People</Th>
                  <Th>Created</Th>
                  <Th>
                    <span className="sr-only">Open</span>
                  </Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <Tr key={row.id}>
                    <Td>
                      <Link
                        href={`/admin/customers/${row.id}`}
                        className="font-medium hover:underline"
                      >
                        {row.displayName}
                      </Link>
                      <span className="block text-xs text-foreground-muted">{row.email}</span>
                    </Td>
                    <Td>
                      <CompanyStatusPill status={row.status} />
                    </Td>
                    <Td>
                      {row.pricingTierName ?? (
                        <span className="text-foreground-subtle">Unassigned</span>
                      )}
                    </Td>
                    <Td className="tabular text-right">{row.memberCount}</Td>
                    <Td className="text-foreground-muted">{formatDate(row.createdAt)}</Td>
                    <Td className="text-right">
                      <Link
                        href={`/admin/customers/${row.id}`}
                        aria-label={`Open ${row.displayName}`}
                        className="inline-flex text-foreground-muted hover:text-foreground"
                      >
                        <ChevronRight className="size-4" aria-hidden />
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
