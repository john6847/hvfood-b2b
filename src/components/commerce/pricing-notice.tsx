import { Lock } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PriceAccess } from "@/modules/catalog/access";

/**
 * Shown in place of prices. Signed-out visitors are asked to sign in or
 * apply; signed-in people whose company is not approved yet are told why.
 */
export function PricingNotice({
  access,
  next,
  className,
}: {
  access: Exclude<PriceAccess, "approved">;
  /** Where sign-in should return to. */
  next: string;
  className?: string;
}) {
  const signedOut = access === "signed-out";
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 sm:flex-row sm:items-center sm:gap-4 sm:p-5",
        className,
      )}
    >
      <Lock className="size-5 shrink-0 text-foreground-muted" aria-hidden />
      <div className="flex-1">
        <p className="text-sm font-semibold text-foreground">
          {signedOut ? "Sign in to see wholesale prices" : "Prices show once your account is approved"}
        </p>
        <p className="mt-0.5 text-xs text-foreground-muted sm:text-sm">
          {signedOut
            ? "Case prices and volume breaks are for approved wholesale customers. New here? Apply with your business details."
            : "Our team is reviewing your company. You can browse products in the meantime."}
        </p>
      </div>
      {signedOut ? (
        <div className="flex gap-2">
          <ButtonLink href={`/login?next=${encodeURIComponent(next)}`} size="sm">
            Sign in
          </ButtonLink>
          <ButtonLink href="/wholesale/apply" variant="secondary" size="sm">
            Apply
          </ButtonLink>
        </div>
      ) : null}
    </div>
  );
}
