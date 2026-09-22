import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Panel, PanelHeader, PanelBody } from "@/components/ui/panel";
import { StatusPill } from "@/components/ui/status-pill";
import { Notice } from "@/components/ui/notice";
import { formatDate } from "@/lib/utils";
import { getApplicationDetails, getPricingTiers } from "@/modules/accounts/application-service";
import { guardPermission } from "@/modules/identity/guards";
import { ApplicationReviewActions } from "@/components/admin/application-review-actions";

export const metadata: Metadata = { title: "Review Application" };

const statusTone: Record<string, "warning" | "success" | "danger" | "neutral"> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "danger",
  SUSPENDED: "neutral",
};

export default async function AdminApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await guardPermission("applications.review");
  const { id } = await params;
  const [app, pricingTiers] = await Promise.all([
    getApplicationDetails(id),
    getPricingTiers(),
  ]);

  if (!app) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/applications"
          className="inline-flex items-center gap-1.5 text-xs text-foreground-muted hover:text-foreground mb-3 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Applications
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                {app.business_name}
              </h1>
              <StatusPill tone={statusTone[app.status] ?? "neutral"}>
                {app.status}
              </StatusPill>
            </div>
            <p className="mt-1 text-xs text-foreground-muted">
              Submitted on {formatDate(app.created_at)}
            </p>
          </div>
        </div>
      </div>

      {app.potentialDuplicates && app.potentialDuplicates.length > 0 && (
        <Notice tone="warning" title="Potential Duplicate Account Detected">
          <p className="text-xs">
            We found existing companies matching this applicant&apos;s details:
          </p>
          <ul className="mt-1.5 list-disc pl-4 text-xs space-y-0.5">
            {app.potentialDuplicates.map((dup, i) => (
              <li key={i}>
                Matching <strong>{dup.type === "EMAIL" ? "Email" : "Company Name"}</strong>:{" "}
                <Link
                  href={`/admin/customers/${dup.companyId}`}
                  className="font-medium underline hover:text-foreground"
                >
                  {dup.companyName}
                </Link>{" "}
                ({dup.status})
              </li>
            ))}
          </ul>
        </Notice>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Dossier Details */}
        <div className="space-y-6 lg:col-span-2">
          {/* 1. Contact & Identity */}
          <Panel>
            <PanelHeader title="Applicant & Business" />
            <PanelBody>
              <dl className="grid gap-4 sm:grid-cols-2 text-xs sm:text-sm">
                <div>
                  <dt className="text-2xs font-medium uppercase tracking-wider text-foreground-muted">
                    Contact Person
                  </dt>
                  <dd className="mt-1 font-medium text-foreground">
                    {app.first_name} {app.last_name}
                  </dd>
                </div>
                <div>
                  <dt className="text-2xs font-medium uppercase tracking-wider text-foreground-muted">
                    Business Structure
                  </dt>
                  <dd className="mt-1 capitalize text-foreground">
                    {app.business_type.toLowerCase().replace("_", " ")}
                  </dd>
                </div>
                <div>
                  <dt className="text-2xs font-medium uppercase tracking-wider text-foreground-muted">
                    Email
                  </dt>
                  <dd className="mt-1 font-mono text-xs text-foreground">
                    <a href={`mailto:${app.email}`} className="hover:underline text-primary">
                      {app.email}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="text-2xs font-medium uppercase tracking-wider text-foreground-muted">
                    Phone
                  </dt>
                  <dd className="mt-1 text-foreground">
                    <a href={`tel:${app.phone}`} className="hover:underline">
                      {app.phone}
                    </a>
                  </dd>
                </div>
                {app.website && (
                  <div>
                    <dt className="text-2xs font-medium uppercase tracking-wider text-foreground-muted">
                      Website
                    </dt>
                    <dd className="mt-1 text-primary hover:underline truncate">
                      <a href={app.website} target="_blank" rel="noopener noreferrer">
                        {app.website}
                      </a>
                    </dd>
                  </div>
                )}
                {app.business_number && (
                  <div>
                    <dt className="text-2xs font-medium uppercase tracking-wider text-foreground-muted">
                      Tax / Resale ID
                    </dt>
                    <dd className="mt-1 font-mono text-foreground">{app.business_number}</dd>
                  </div>
                )}
              </dl>
            </PanelBody>
          </Panel>

          {/* 2. Receiving Address */}
          <Panel>
            <PanelHeader title="Primary Delivery Address" />
            <PanelBody>
              <div className="text-xs sm:text-sm text-foreground space-y-0.5">
                <div className="font-medium">{app.address.street1}</div>
                {app.address.street2 && <div>{app.address.street2}</div>}
                <div>
                  {app.address.city}, {app.address.state} {app.address.postal_code}
                </div>
                <div className="text-foreground-muted text-2xs uppercase tracking-wider">
                  {app.address.country}
                </div>
              </div>
            </PanelBody>
          </Panel>

          {/* 3. Commercial Purchasing Intent */}
          <Panel>
            <PanelHeader title="Commercial Purchasing Intent" />
            <PanelBody>
              <dl className="grid gap-4 sm:grid-cols-2 text-xs sm:text-sm">
                <div className="sm:col-span-2">
                  <dt className="text-2xs font-medium uppercase tracking-wider text-foreground-muted">
                    Estimated Monthly Volume
                  </dt>
                  <dd className="mt-1 font-medium text-foreground">
                    {app.estimated_monthly_volume || "Not specified"}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-2xs font-medium uppercase tracking-wider text-foreground-muted">
                    Products of Interest
                  </dt>
                  <dd className="mt-1.5 flex flex-wrap gap-1.5">
                    {app.products_interested_in.length > 0 ? (
                      app.products_interested_in.map((prod, i) => (
                        <span
                          key={i}
                          className="rounded-md border border-border bg-surface-subtle px-2 py-1 text-2xs text-foreground"
                        >
                          {prod}
                        </span>
                      ))
                    ) : (
                      <span className="text-foreground-muted">None specified</span>
                    )}
                  </dd>
                </div>
                {app.applicant_notes && (
                  <div className="sm:col-span-2">
                    <dt className="text-2xs font-medium uppercase tracking-wider text-foreground-muted">
                      Delivery / Receiving Notes
                    </dt>
                    <dd className="mt-1 rounded-md bg-surface-subtle p-3 text-foreground whitespace-pre-line text-xs">
                      {app.applicant_notes}
                    </dd>
                  </div>
                )}
              </dl>
            </PanelBody>
          </Panel>

          {/* 4. Review History if reviewed */}
          {(app.internal_notes || app.customer_message || app.reviewed_at) && (
            <Panel>
              <PanelHeader title="Review History" />
              <PanelBody>
                <dl className="space-y-3 text-xs sm:text-sm">
                  {app.reviewed_at && (
                    <div>
                      <dt className="text-2xs font-medium uppercase tracking-wider text-foreground-muted">
                        Reviewed At
                      </dt>
                      <dd className="mt-1 text-foreground">{formatDate(app.reviewed_at)}</dd>
                    </div>
                  )}
                  {app.internal_notes && (
                    <div>
                      <dt className="text-2xs font-medium uppercase tracking-wider text-foreground-muted">
                        Internal Operations Notes
                      </dt>
                      <dd className="mt-1 rounded-md bg-surface-subtle p-2.5 text-foreground whitespace-pre-line">
                        {app.internal_notes}
                      </dd>
                    </div>
                  )}
                  {app.customer_message && (
                    <div>
                      <dt className="text-2xs font-medium uppercase tracking-wider text-foreground-muted">
                        Customer Rejection Message
                      </dt>
                      <dd className="mt-1 rounded-md bg-surface-subtle p-2.5 text-foreground whitespace-pre-line">
                        {app.customer_message}
                      </dd>
                    </div>
                  )}
                </dl>
              </PanelBody>
            </Panel>
          )}
        </div>

        {/* Right Column: Actions */}
        <div className="space-y-6">
          <ApplicationReviewActions
            applicationId={app.id}
            status={app.status}
            companyId={app.company_id}
            pricingTiers={pricingTiers}
          />
        </div>
      </div>
    </div>
  );
}
