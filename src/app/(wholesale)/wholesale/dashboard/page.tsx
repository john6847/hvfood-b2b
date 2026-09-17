import type { Metadata } from "next";
import { ClipboardList, Package, RotateCcw, Store } from "lucide-react";
import { OrderTable } from "@/components/commerce/order-table";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import { PageHeading } from "@/components/ui/page-heading";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { CompanyStatusPill } from "@/components/ui/status-pill";
import { brand } from "@/config/brand";
import { accessStateFor } from "@/modules/identity/company-access";
import { getActiveMembership, getProfile } from "@/modules/identity/service";
import { listCompanyOrders } from "@/modules/orders/queries";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const [membership, profile] = await Promise.all([getActiveMembership(), getProfile()]);
  const state = accessStateFor(membership?.companyStatus);
  const firstName = profile?.first_name || "there";

  if (state === "none") {
    return (
      <>
        <PageHeading
          eyebrow="Wholesale account"
          title={`Hello, ${firstName}.`}
          description="Your sign-in works, but it is not linked to a wholesale company yet."
        />
        <Notice tone="info" title="No company on this account">
          If your business applied for wholesale, the activation link in your approval email
          connects this sign-in to your company. Otherwise, contact {brand.supportEmail}.
        </Notice>
      </>
    );
  }

  if (state === "pending") {
    return (
      <>
        <PageHeading
          eyebrow={membership?.companyDisplayName}
          title="Your application is under review."
          description="Our wholesale team is reviewing your business details. You will get an email when a decision is made."
        />
        <Notice tone="warning" title="Wholesale pricing is available to approved customers">
          Prices, the catalog and ordering unlock once your company is approved. Nothing else is
          needed from you right now.
        </Notice>
      </>
    );
  }

  if (state === "suspended") {
    return (
      <>
        <PageHeading
          eyebrow={membership?.companyDisplayName}
          title="This account is suspended."
          description="Browsing, pricing and new orders are paused. Your order history and documents stay available to your team."
        />
        <Notice tone="danger" title="Contact the wholesale team">
          To resolve the suspension, reach us at {brand.supportEmail} or {brand.supportPhone}.
        </Notice>
      </>
    );
  }

  if (state === "rejected") {
    return (
      <PageHeading
        eyebrow={membership?.companyDisplayName}
        title="This application was not approved."
        description="The decision email explains the next steps. You can reply to it with questions."
      />
    );
  }

  const orders = membership ? await listCompanyOrders(membership.companyId) : [];
  const recent = orders.slice(0, 4);

  return (
    <>
      <PageHeading
        eyebrow="Good to see you"
        title={`Welcome back, ${membership?.companyDisplayName}.`}
        description="Shop by the case, reorder what you carry, and keep your delivery locations current."
        action={membership ? <CompanyStatusPill status={membership.companyStatus} /> : null}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <QuickAction
          href="/wholesale/catalog"
          icon={<Store aria-hidden />}
          title="Shop products"
          description="Browse the wholesale catalog with your prices."
        />
        <QuickAction
          href="/wholesale/quick-order"
          icon={<ClipboardList aria-hidden />}
          title="Quick order"
          description="Enter SKUs and case quantities directly."
        />
        <QuickAction
          href="/wholesale/orders"
          icon={<RotateCcw aria-hidden />}
          title="Reorder"
          description="Repeat a previous order in a few clicks."
        />
        <QuickAction
          href="/wholesale/account"
          icon={<Package aria-hidden />}
          title="Account"
          description="Company details, people and delivery locations."
        />
      </div>

      <Panel className="mt-8">
        <PanelHeader
          title="Recent orders"
          description="Your latest wholesale orders and their status."
          action={
            <ButtonLink href="/wholesale/orders" variant="secondary" size="sm">
              View all orders
            </ButtonLink>
          }
        />
        {recent.length === 0 ? (
          <PanelBody>
            <EmptyState
              title="No orders yet"
              description="Ordering opens with the catalog and purchasing releases. Your first order will appear here with its payment and shipping status."
            />
          </PanelBody>
        ) : (
          <OrderTable orders={recent} basePath="/wholesale/orders" />
        )}
      </Panel>
    </>
  );
}

function QuickAction({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <a
      href={href}
      className="group flex flex-col gap-3 rounded-lg border border-border bg-surface p-5 transition-colors hover:border-border-strong"
    >
      <span className="text-primary [&_svg]:size-5">{icon}</span>
      <span>
        <span className="block text-base font-semibold text-foreground group-hover:underline group-hover:underline-offset-4">
          {title}
        </span>
        <span className="mt-1 block text-sm text-foreground-muted">{description}</span>
      </span>
    </a>
  );
}
