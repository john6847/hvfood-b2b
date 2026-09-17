import { Wordmark } from "@/components/ui/wordmark";
import { brand } from "@/config/brand";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main id="main" className="flex flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 py-12 sm:py-20">
        <Wordmark className="mb-10" />
        {children}
        <p className="mt-10 text-xs text-foreground-subtle">
          {brand.name}. {brand.market}, {brand.currency}.
        </p>
      </div>
    </main>
  );
}
