import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Honest empty state. Used both for "no data yet" and for sections that a
 * later delivery phase will fill; the copy says which.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-start gap-3 rounded-lg border border-dashed border-border-strong bg-surface px-6 py-8",
        className,
      )}
    >
      {icon ? <div className="text-foreground-subtle [&_svg]:size-6">{icon}</div> : null}
      <div>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {description ? (
          <p className="mt-1 max-w-prose text-sm text-foreground-muted">{description}</p>
        ) : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}
