import Link from "next/link";
import { STATIC_PREVIEW } from "@/lib/env";

/**
 * Says plainly that this deployment has no database behind it, and switches
 * between the two portals. Rendered only in static preview, so a connected
 * deployment never shows it.
 */
export function PreviewBar() {
  if (!STATIC_PREVIEW) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 bg-ink px-4 py-1.5 text-2xs uppercase tracking-[0.12em] text-ink-foreground sm:px-6">
      <p className="flex items-center gap-2">
        <span aria-hidden className="size-1.5 rounded-full bg-brand-orange" />
        Design preview
        <span className="hidden normal-case tracking-normal text-ink-muted sm:inline">
          Sample accounts, orders and pricing. No live data.
        </span>
      </p>
      <nav aria-label="Preview" className="flex items-center gap-2.5 text-2xs">
        <Link href="/wholesale/dashboard" className="hover:text-brand-orange">
          Buyer portal
        </Link>
        <span aria-hidden className="text-ink-muted">
          /
        </span>
        <Link href="/admin" className="hover:text-brand-orange">
          Admin workspace
        </Link>
      </nav>
    </div>
  );
}
