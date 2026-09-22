import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { Wordmark } from "@/components/ui/wordmark";
import { brand } from "@/config/brand";

/**
 * Public entry. Visitors can browse products in the catalog, but prices
 * stay behind sign-in: "Wholesale pricing available to approved customers"
 * is the rule.
 */
export default function HomePage() {
  return (
    <main id="main" className="flex flex-1 flex-col">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-(--content-max) flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-6 sm:py-5">
          <Wordmark />
          <nav className="flex items-center gap-2 sm:gap-3" aria-label="Primary">
            <Link
              href="/wholesale/catalog"
              className="hidden px-2 text-sm font-medium text-foreground-muted hover:text-foreground sm:inline"
            >
              Products
            </Link>
            <ButtonLink href="/login" variant="secondary" size="sm">
              Sign in
            </ButtonLink>
            <ButtonLink href="/wholesale/apply" size="sm">
              Apply
            </ButtonLink>
          </nav>
        </div>
      </header>

      <section className="mx-auto w-full max-w-(--content-max) px-4 py-12 sm:px-6 sm:py-20 md:py-24">
        <p className="eyebrow mb-2.5 sm:mb-3">{brand.market}</p>
        <h1 className="max-w-3xl text-xl font-semibold leading-tight tracking-tight text-foreground sm:text-2xl">
          Wholesale ordering for stores, restaurants and distributors who carry Horizon Vert.
        </h1>
        <p className="mt-4 sm:mt-5 max-w-2xl text-sm sm:text-md text-foreground-muted leading-relaxed">
          Wholesale pricing is available to approved customers. Apply with your business
          details, and our team will review your application. Once approved, you can order by
          the case, see your prices and volume breaks, and reorder in a few clicks.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <ButtonLink href="/wholesale/apply" size="lg" className="w-full sm:w-auto">
            Apply for wholesale
          </ButtonLink>
          <ButtonLink href="/wholesale/catalog" variant="secondary" size="lg" className="w-full sm:w-auto">
            Browse products
          </ButtonLink>
        </div>
        <p className="mt-4 text-xs sm:text-sm text-foreground-muted">
          Already approved?{" "}
          <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
            Sign in to see your prices
          </Link>
        </p>

        <dl className="mt-12 sm:mt-16 grid max-w-3xl gap-6 sm:gap-8 border-t border-border pt-8 sm:grid-cols-3">
          <div>
            <dt className="text-sm font-semibold text-foreground">1. Apply</dt>
            <dd className="mt-1 text-xs sm:text-sm text-foreground-muted">
              Tell us about your business, where you sell and what you want to carry.
            </dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-foreground">2. Review</dt>
            <dd className="mt-1 text-xs sm:text-sm text-foreground-muted">
              Our wholesale team reviews each application and sets up your account.
            </dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-foreground">3. Order</dt>
            <dd className="mt-1 text-xs sm:text-sm text-foreground-muted">
              Activate your account, add delivery locations and place your first case order.
            </dd>
          </div>
        </dl>
      </section>

      <footer className="mt-auto border-t border-border bg-surface">
        <div className="mx-auto flex max-w-(--content-max) flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-5 text-xs text-foreground-muted">
          <span>
            {brand.name}. {brand.tagline}
          </span>
          <a href={brand.retailSiteUrl} className="underline underline-offset-4">
            Retail store
          </a>
        </div>
      </footer>
    </main>
  );
}
