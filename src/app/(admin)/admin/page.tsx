import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { StatusPill } from "@/components/ui/status-pill";
import { createSessionClient } from "@/lib/supabase/server";
import { hasPermission } from "@/modules/identity/permissions";
import { guardStaff } from "@/modules/identity/guards";
import { getProfile } from "@/modules/identity/service";

export const metadata: Metadata = { title: "Home" };

/**
 * Operations home. Shows real counts where data exists (companies) and
 * honest empty states for areas later phases fill. No invented metrics.
 */
export default async function AdminHomePage() {
  const staff = await guardStaff();
  const profile = await getProfile();
  const supabase = await createSessionClient();

  const canSeeAccounts = hasPermission(staff.permissions, "accounts.read");
  const counts: Record<string, number> = {};
  if (canSeeAccounts) {
    const { data } = await supabase.rpc("admin_company_counts");
    for (const row of data ?? []) counts[row.status] = Number(row.total);
  }

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

      <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          label="Approved customers"
          value={canSeeAccounts ? counts.APPROVED ?? 0 : null}
          note="Companies able to order"
          href="/admin/customers?status=APPROVED"
        />
        <Metric
          label="Pending review"
          value={canSeeAccounts ? counts.PENDING ?? 0 : null}
          note="Companies awaiting a decision"
          href="/admin/customers?status=PENDING"
        />
        <Metric
          label="Suspended"
          value={canSeeAccounts ? counts.SUSPENDED ?? 0 : null}
          note="Purchasing paused"
          href="/admin/customers?status=SUSPENDED"
        />
        <Metric label="Orders needing action" value={null} note="Arrives with purchasing" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Panel>
          <PanelHeader
            title="Recent orders"
            description="Latest wholesale orders with payment and fulfillment state."
          />
          <PanelBody>
            <EmptyState
              title="No orders yet"
              description="Orders, payment holds and fulfillment queues appear once the purchasing release is live."
            />
          </PanelBody>
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
                <li key={name} className="flex items-center justify-between px-5 py-3 text-sm">
                  <span>
                    <span className="font-medium text-foreground">{name}</span>
                    <span className="text-foreground-muted"> · {purpose}</span>
                  </span>
                  <StatusPill tone="neutral">Not connected</StatusPill>
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
  value: number | null;
  note: string;
  href?: string;
}) {
  const body = (
    <>
      <p className="text-xs text-foreground-muted">{label}</p>
      <p className="tabular mt-3 text-xl font-semibold tracking-tight text-foreground">
        {value === null ? <span className="text-foreground-subtle">–</span> : value}
      </p>
      <p className="mt-2 flex items-center gap-1 text-xs text-foreground-subtle">
        {note}
        {href ? <ArrowRight className="size-3" aria-hidden /> : null}
      </p>
    </>
  );
  const className = "block bg-surface p-5";
  return href ? (
    <Link href={href} className={`${className} hover:bg-surface-muted`}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}
