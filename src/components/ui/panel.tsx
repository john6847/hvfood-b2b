import * as React from "react";
import { cn } from "@/lib/utils";

/** The one card treatment used everywhere: white surface, 1px rule, small radius. */
export function Panel({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      className={cn("rounded-lg border border-border bg-surface", className)}
      {...props}
    />
  );
}

export function PanelHeader({
  title,
  description,
  action,
  as: Heading = "h2",
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  as?: "h1" | "h2" | "h3";
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-3.5 sm:px-5 sm:py-4">
      <div>
        <Heading className="text-md font-semibold text-foreground">{title}</Heading>
        {description ? (
          <p className="mt-1 text-xs text-foreground-muted sm:text-sm">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

export function PanelBody({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("px-4 py-3.5 sm:px-5 sm:py-4", className)} {...props} />;
}

/** Key/value rows for record pages. */
export function DefinitionList({
  items,
}: {
  items: ReadonlyArray<{ term: string; value: React.ReactNode }>;
}) {
  return (
    <dl className="divide-y divide-border">
      {items.map((item) => (
        <div key={item.term} className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-3 sm:gap-4">
          <dt className="text-xs font-medium text-foreground-muted sm:text-sm">{item.term}</dt>
          <dd className="break-words text-sm text-foreground sm:col-span-2">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
