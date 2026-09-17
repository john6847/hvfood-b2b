import Link from "next/link";
import { brand } from "@/config/brand";
import { cn } from "@/lib/utils";

/**
 * Text wordmark matching the preview until the logo asset is supplied by
 * the brand owner. Two stacked words in brand orange, small caption below.
 */
export function Wordmark({
  href = "/",
  caption = brand.wholesaleLabel,
  className,
}: {
  href?: string;
  caption?: string;
  className?: string;
}) {
  return (
    <Link href={href} className={cn("inline-flex flex-col leading-none", className)}>
      <span className="text-[1.375rem] font-extrabold uppercase tracking-tight text-brand-orange">
        Horizon
        <br />
        Vert<span className="align-super text-[0.5rem]">®</span>
      </span>
      <span className="mt-1.5 text-2xs font-semibold uppercase tracking-[0.18em] text-foreground-muted">
        {caption}
      </span>
      <span className="sr-only">{brand.name}</span>
    </Link>
  );
}
