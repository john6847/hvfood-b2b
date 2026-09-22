import { brand } from "@/config/brand";

export function PortalFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto flex max-w-(--content-max) flex-wrap items-center justify-between gap-3 px-4 py-3.5 text-xs text-foreground-muted sm:px-6 sm:py-4">
        <span>
          {brand.name}. {brand.tagline}
        </span>
        <span>
          {brand.market} · {brand.currency}
        </span>
      </div>
    </footer>
  );
}
