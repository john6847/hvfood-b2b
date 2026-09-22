import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { OrderTable } from "@/components/commerce/order-table";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { StatusPill } from "@/components/ui/status-pill";
import { formatDate, formatMinorUsd } from "@/lib/utils";
import { companyCounts, pendingApplications } from "@/modules/accounts/queries";
import { guardStaff } from "@/modules/identity/guards";
import { hasPermission } from "@/modules/identity/permissions";
import { getProfile } from "@/modules/identity/service";
import { listAllOrders } from "@/modules/orders/queries";

export const metadata: Metadata = { title: "Home" };

/**
 * Operations home: what needs attention, with real counts where data
 * exists and honest empty states everywhere else. No invented metrics.
 */
export default async function AdminHomePage() {
  const staff = await guardStaff();
  const profile = await getProfile();

  const canSeeAccounts = hasPermission(staff.permissions, "accounts.read");
  const canSeeOrders = hasPermission(staff.permissions, "orders.read");

  const [counts, orders, applications] = await Promise.all([
    canSeeAccounts ? companyCounts() : Promise.resolve({} as Record<string, number>),
    canSeeOrders ? listAllOrders() : Promise.resolve([]),
    canSeeAccounts ? pendingApplications() : Promise.resolve([]),
  ]);

  const needsAction = orders.filter(
    (o) => o.status === "ON_HOLD" || o.fulfillmentStatus === "UNFULFILLED",
  );
  const openValue = orders.reduce((sum, o) => sum + o.totalMinor, 0);

  const today = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  return (
    <>
      <PageHeading
        eyebrow="Horizon Vert · Operations"
        title={`${greeting()}, ${profile?.first_name || "there"}.`}
        description="What needs your attention across accounts, orders and fulfillment."
        action={<p className="text-sm text-foreground-muted">{today}</p>}
      />

      <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          label="Orders needing action"
          value={canSeeOrders ? String(needsAction.length) : null}
          note="On hold or awaiting fulfillment"
          href="/admin/orders"
        />
        <Metric
          label="Order value"
          value={canSeeOrders ? formatMinorUsd(openValue) : null}
          note={`Across ${orders.length} orders`}
        />
        <Metric
          label="Applications to review"
          value={canSeeAccounts ? String(applications.length) : null}
          note="Awaiting a decision"
        />
        <Metric
          label="Approved customers"
          value={canSeeAccounts ? String(counts.APPROVED ?? 0) : null}
          note="Companies able to order"
          href="/admin/customers?status=APPROVED"
        />
      </div>

      <Panel className="mt-6 sm:mt-8">
        <PanelHeader
          title="Recent orders"
          description="Latest wholesale orders with payment and fulfillment state."
          action={
            <ButtonLink href="/admin/orders" variant="secondary" size="sm">
              View all orders
            </ButtonLink>
          }
        />
        {orders.length === 0 ? (
          <PanelBody>
            <EmptyState
              title="No orders yet"
              description="Orders, payment holds and fulfillment queues appear once the purchasing release is live."
            />
          </PanelBody>
        ) : (
          <OrderTable orders={orders.slice(0, 5)} basePath="/admin/orders" showCustomer />
        )}
      </Panel>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel>
          <PanelHeader
            title="Applications to review"
            description="New businesses waiting on a decision."
          />
          {applications.length === 0 ? (
            <PanelBody>
              <EmptyState
                title="Nothing waiting"
                description="Application review opens with the accounts release."
              />
            </PanelBody>
          ) : (
            <PanelBody className="p-0">
              <ul className="divide-y divide-border">
                {applications.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {a.businessName}
                      </p>
                      <p className="truncate text-xs text-foreground-muted">
                        {a.city}, {a.region} · {a.businessType}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-foreground-muted">
                      {formatDate(a.submittedAt)}
                    </span>
                  </li>
                ))}
              </ul>
            </PanelBody>
          )}
        </Panel>

        <Panel>
          <PanelHeader
            title="Commerce connections"
            description="Integrations are configured during their implementation phases."
          />
          <PanelBody className="p-0">
            <ul className="divide-y divide-border">
              {[
                ["Shopify", "Product catalog"],
                ["Stripe", "Cards and ACH"],
                ["ShipStation", "Fulfillment"],
              ].map(([name, purpose]) => (
                <li key={name} className="flex items-center justify-between px-4 py-3 text-sm sm:px-5">
                  <span>
                    <span className="font-medium text-foreground">{name}</span>
                    <span className="text-foreground-muted"> · {purpose}</span>
                  </span>
                  <StatusPill tone="neutral" className="shrink-0">Not connected</StatusPill>
                </li>
              ))}
            </ul>
          </PanelBody>
        </Panel>
      </div>
    </>
  );
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function Metric({
  label,
  value,
  note,
  href,
}: {
  label: string;
  value: string | null;
  note: string;
  href?: string;
}) {
  const body = (
    <>
      <p className="text-xs text-foreground-muted">{label}</p>
      <p className="tabular mt-2 sm:mt-3 text-xl font-semibold tracking-tight text-foreground">
        {value === null ? <span className="text-foreground-subtle">–</span> : value}
      </p>
      <p className="mt-1.5 sm:mt-2 flex items-center gap-1 text-xs text-foreground-subtle">
        {note}
        {href ? <ArrowRight className="size-3" aria-hidden /> : null}
      </p>
    </>
  );
  const className = "block bg-surface p-4 sm:p-5";
  return href ? (
    <Link href={href} className={`${className} hover:bg-surface-muted`}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}
