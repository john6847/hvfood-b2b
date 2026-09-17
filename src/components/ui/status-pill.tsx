import { cn } from "@/lib/utils";

export type PillTone = "success" | "warning" | "danger" | "info" | "neutral";

const tones: Record<PillTone, string> = {
  success: "bg-success-bg text-success-fg",
  warning: "bg-warning-bg text-warning-fg",
  danger: "bg-danger-bg text-danger-fg",
  info: "bg-info-bg text-info-fg",
  neutral: "bg-muted text-foreground-muted",
};

export function StatusPill({
  tone = "neutral",
  children,
  className,
}: {
  tone?: PillTone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm px-2 py-1 text-2xs font-semibold uppercase tracking-wider",
        tones[tone],
        className,
      )}
    >
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

const companyStatusTone: Record<string, PillTone> = {
  APPROVED: "success",
  PENDING: "warning",
  SUSPENDED: "danger",
  REJECTED: "neutral",
};

const companyStatusLabel: Record<string, string> = {
  APPROVED: "Approved",
  PENDING: "Pending review",
  SUSPENDED: "Suspended",
  REJECTED: "Not approved",
};

export function CompanyStatusPill({ status }: { status: string }) {
  return (
    <StatusPill tone={companyStatusTone[status] ?? "neutral"}>
      {companyStatusLabel[status] ?? status}
    </StatusPill>
  );
}
