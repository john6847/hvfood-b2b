import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";
import { Wordmark } from "@/components/ui/wordmark";
import { ApplicationForm } from "@/components/commerce/application-form";

export const metadata: Metadata = { title: "Apply for Wholesale Account" };

/**
 * Public wholesale application page.
 * Collects commercial purchasing facts, address, and contact details
 * without requiring upfront account creation.
 */
export default function ApplyPage() {
  return (
    <main id="main" className="flex flex-1 flex-col">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-(--content-max) items-center justify-between px-4 py-3.5 sm:px-6 sm:py-5">
          <Wordmark />
          <div className="flex items-center gap-3">
            <ButtonLink href="/wholesale/catalog" variant="ghost" size="sm">
              Browse Catalog
            </ButtonLink>
            <ButtonLink href="/login" variant="secondary" size="sm">
              Sign in
            </ButtonLink>
          </div>
        </div>
      </header>

      <section className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <p className="eyebrow mb-2">Wholesale Onboarding</p>
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          Apply for a Wholesale Account
        </h1>
        <p className="mt-2 text-sm text-foreground-muted sm:text-base leading-relaxed">
          Access case-tier wholesale pricing, recurring ordering, and flexible commercial delivery.
          Applications are reviewed by our operations team within 1 to 2 business days.
        </p>

        <div className="mt-8 rounded-lg border border-border bg-surface p-6 sm:p-8">
          <ApplicationForm />
        </div>
      </section>
    </main>
  );
}
