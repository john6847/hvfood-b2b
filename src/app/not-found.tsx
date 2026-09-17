import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main id="main" className="mx-auto flex max-w-lg flex-1 flex-col justify-center px-6 py-24">
      <p className="eyebrow mb-2">404</p>
      <h1 className="text-xl font-semibold text-foreground">That page does not exist.</h1>
      <p className="mt-2 text-sm text-foreground-muted">
        Check the address, or head back to your dashboard.
      </p>
      <div className="mt-6">
        <ButtonLink href="/" variant="secondary">
          Go to start
        </ButtonLink>
      </div>
    </main>
  );
}
