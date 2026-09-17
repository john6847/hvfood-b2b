import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Dense operational table. Wraps in a horizontal scroller so wide admin
 * tables stay usable on small screens instead of being squeezed.
 */
export function TableScroll({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("w-full overflow-x-auto", className)} {...props} />;
}

export function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <table
      className={cn("w-full whitespace-nowrap text-left text-sm", className)}
      {...props}
    />
  );
}

export function Th({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      scope="col"
      className={cn(
        "border-y border-border bg-surface-muted px-4 py-3 text-2xs font-semibold uppercase tracking-wider text-foreground-muted",
        className,
      )}
      {...props}
    />
  );
}

export function Td({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      className={cn("border-b border-border px-4 py-3.5 align-middle text-foreground", className)}
      {...props}
    />
  );
}

export function Tr({ className, ...props }: React.ComponentProps<"tr">) {
  return <tr className={cn("hover:bg-surface-muted", className)} {...props} />;
}
