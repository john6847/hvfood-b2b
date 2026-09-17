import { ButtonLink } from "@/components/ui/button";
import { STATIC_PREVIEW } from "@/lib/env";
import { Wordmark } from "@/components/ui/wordmark";
import { brand } from "@/config/brand";

/**
 * Public entry. Anonymous visitors never see products or prices here:
 * "Wholesale pricing available to approved customers" is the rule.
 */
export default function HomePage() {
  return (
    <main id="main" className="flex flex-1 flex-col">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-(--content-max) items-center justify-between px-6 py-5">
          <Wordmark />
          <nav className="flex items-center gap-3" aria-label="Primary">
            {STATIC_PREVIEW ? (
              <ButtonLink href="/wholesale/dashboard" variant="secondary" size="sm">
                Open the preview
              </ButtonLink>
            ) : (
              <ButtonLink href="/login" variant="secondary" size="sm">
                Sign in
              </ButtonLink>
            )}
            <ButtonLink href="/wholesale/apply" size="sm">
              Apply for wholesale
            </ButtonLink>
          </nav>
        </div>
      </header>

      <section className="mx-auto w-full max-w-(--content-max) px-6 py-16 sm:py-24">
        <p className="eyebrow mb-3">{brand.market}</p>
        <h1 className="max-w-3xl text-2xl font-semibold leading-tight tracking-tight text-foreground">
          Wholesale ordering for stores, restaurants and distributors who carry Horizon Vert.
        </h1>
        <p className="mt-5 max-w-2xl text-md text-foreground-muted">
          Wholesale pricing is available to approved customers. Apply with your business
          details, and our team will review your application. Once approved, you can order by
          the case, see your prices and volume breaks, and reorder in a few clicks.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/wholesale/apply" size="lg">
            Apply for wholesale
          </ButtonLink>
          {STATIC_PREVIEW ? (
            <ButtonLink href="/wholesale/dashboard" variant="secondary" size="lg">
              Open the design preview
            </ButtonLink>
          ) : (
            <ButtonLink href="/login" variant="secondary" size="lg">
              Approved customer sign in
            </ButtonLink>
          )}
        </div>

        <dl className="mt-16 grid max-w-3xl gap-8 border-t border-border pt-8 sm:grid-cols-3">
          <div>
            <dt className="text-sm font-semibold text-foreground">1. Apply</dt>
            <dd className="mt-1 text-sm text-foreground-muted">
              Tell us about your business, where you sell and what you want to carry.
            </dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-foreground">2. Review</dt>
            <dd className="mt-1 text-sm text-foreground-muted">
              Our wholesale team reviews each application and sets up your account.
            </dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-foreground">3. Order</dt>
            <dd className="mt-1 text-sm text-foreground-muted">
              Activate your account, add delivery locations and place your first case order.
            </dd>
          </div>
        </dl>
      </section>

      <footer className="mt-auto border-t border-border bg-surface">
        <div className="mx-auto flex max-w-(--content-max) flex-wrap items-center justify-between gap-3 px-6 py-5 text-xs text-foreground-muted">
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
