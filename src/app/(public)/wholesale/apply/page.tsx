import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { Wordmark } from "@/components/ui/wordmark";
import { brand } from "@/config/brand";

export const metadata: Metadata = { title: "Apply for wholesale" };

/**
 * Public application entry. The online form, duplicate review and
 * rate-limited submission endpoint ship in Phase 2 (accounts). This page
 * already states what an applicant needs so nothing here is a dead end.
 */
export default function ApplyPage() {
  return (
    <main id="main" className="flex flex-1 flex-col">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-(--content-max) items-center justify-between px-6 py-5">
          <Wordmark />
          <ButtonLink href="/login" variant="secondary" size="sm">
            Sign in
          </ButtonLink>
        </div>
      </header>

      <section className="mx-auto w-full max-w-3xl px-6 py-12 sm:py-16">
        <p className="eyebrow mb-3">Wholesale accounts</p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Apply for a wholesale account
        </h1>
        <p className="mt-4 text-md text-foreground-muted">
          Wholesale pricing is available to approved businesses in the United States. Approval
          takes a short review by our team. There is no fee to apply.
        </p>

        <Notice tone="info" className="mt-8" title="Online applications open with the next release">
          The application form is part of the accounts release. In the meantime, send the
          details below to {brand.supportEmail} and the wholesale team will set up your account.
        </Notice>

        <h2 className="mt-10 text-md font-semibold text-foreground">What we ask for</h2>
        <ul className="mt-3 grid gap-2 text-sm text-foreground-muted sm:grid-cols-2">
          <li>Your name and role</li>
          <li>Business name and website</li>
          <li>Business type (retail, restaurant, distributor, other)</li>
          <li>Business address, city, state and ZIP</li>
          <li>Business email and phone</li>
          <li>Business or resale tax number, if applicable</li>
          <li>Estimated monthly order volume</li>
          <li>Products you are interested in</li>
        </ul>

        <h2 className="mt-10 text-md font-semibold text-foreground">What happens next</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-foreground-muted">
          <li>We confirm we received your application.</li>
          <li>Our team reviews it and may contact you with questions.</li>
          <li>Once approved, you receive an activation email to set up your sign-in.</li>
          <li>Add your delivery locations and place your first case order.</li>
        </ol>
      </section>
    </main>
  );
}
