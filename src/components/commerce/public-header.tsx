import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { Wordmark } from "@/components/ui/wordmark";

/** Header for visitors who are not signed in: browse, sign in or apply. */
export function PublicHeader() {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-(--content-max) flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <Wordmark />
        <nav className="flex items-center gap-2 sm:gap-3" aria-label="Primary">
          <Link
            href="/wholesale/catalog"
            className="hidden px-2 text-sm font-medium text-foreground-muted hover:text-foreground sm:inline"
          >
            Products
          </Link>
          <ButtonLink href="/login?next=/wholesale/catalog" variant="secondary" size="sm">
            Sign in
          </ButtonLink>
          <ButtonLink href="/wholesale/apply" size="sm">
            Apply
          </ButtonLink>
        </nav>
      </div>
    </header>
  );
}
