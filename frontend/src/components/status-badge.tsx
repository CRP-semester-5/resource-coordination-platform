import { cn } from "@/lib/utils";

type Tone = "pending" | "approved" | "success" | "danger" | "neutral";

const TONE_MAP: Record<string, Tone> = {
  Pending: "pending",
  "Pending Verification": "pending",
  "Under Review": "pending",
  Assigned: "pending",
  Busy: "pending",
  Approved: "approved",
  Accepted: "approved",
  Active: "success",
  Available: "success",
  Fulfilled: "success",
  Completed: "success",
  "Partially Fulfilled": "approved",
  "In Progress": "approved",
  Rejected: "danger",
  Suspended: "danger",
  Critical: "danger",
  High: "pending",
  Medium: "approved",
  Low: "neutral",
  Cancelled: "neutral",
  Unavailable: "neutral",
  Disabled: "neutral",
};

const TONE_CLASS: Record<Tone, string> = {
  pending: "bg-status-pending-muted text-status-pending-foreground border-status-pending/30",
  approved: "bg-status-approved-muted text-status-approved-foreground border-status-approved/30",
  success: "bg-status-success-muted text-status-success-foreground border-status-success/30",
  danger: "bg-status-danger-muted text-status-danger-foreground border-status-danger/30",
  neutral: "bg-status-neutral-muted text-status-neutral-foreground border-status-neutral/30",
};

export function StatusBadge({ value, className }: { value: string; className?: string }) {
  const tone = TONE_MAP[value] ?? "neutral";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        TONE_CLASS[tone],
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", `bg-status-${tone}`)} />
      {value}
    </span>
  );
}
