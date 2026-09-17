"use client";

import { useRef } from "react";
import { Building2 } from "lucide-react";
import type { Membership } from "@/modules/identity/company-access";

/**
 * Switches the acting company. Posts to a route handler that validates the
 * choice against current memberships before setting the cookie.
 */
export function CompanySwitcher({
  memberships,
  active,
}: {
  memberships: readonly Membership[];
  active: Membership | null;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  if (!active) return null;

  if (memberships.length === 1) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Building2 aria-hidden className="size-4 text-foreground-muted" />
        <div className="leading-tight">
          <p className="text-2xs uppercase tracking-wider text-foreground-muted">Your business account</p>
          <p className="font-medium text-foreground">{active.companyDisplayName}</p>
        </div>
      </div>
    );
  }

  return (
    <form ref={formRef} action="/wholesale/switch" method="post" className="flex items-center gap-2">
      <Building2 aria-hidden className="size-4 text-foreground-muted" />
      <label className="flex flex-col leading-tight">
        <span className="text-2xs uppercase tracking-wider text-foreground-muted">Business account</span>
        <select
          name="companyId"
          defaultValue={active.companyId}
          onChange={() => formRef.current?.requestSubmit()}
          className="h-7 rounded-sm border border-border bg-surface pl-1 pr-6 text-sm font-medium text-foreground"
        >
          {memberships.map((m) => (
            <option key={m.companyId} value={m.companyId}>
              {m.companyDisplayName}
            </option>
          ))}
        </select>
      </label>
      <noscript>
        <button type="submit" className="text-xs underline">
          Switch
        </button>
      </noscript>
    </form>
  );
}
