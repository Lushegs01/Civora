import { cn } from "@/lib/utils";
import { RESPONSE_META, TONE_STYLES, VERIFICATION_META } from "@/lib/states";
import type { ResponseState, VerificationState } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";

// Verification and response are separate axes and are always rendered
// separately, with icon + label (never colour alone).

export function VerificationBadge({
  state,
  size = "md",
  className
}: {
  state: VerificationState;
  size?: "sm" | "md";
  className?: string;
}) {
  const meta = VERIFICATION_META[state];
  const tone = TONE_STYLES[meta.tone];
  return (
    <span
      className={cn("chip", tone.chip, size === "sm" && "px-2 py-0.5 text-[11px]", className)}
      title={meta.description}
    >
      <Icon name={meta.icon} className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
      {meta.label}
    </span>
  );
}

export function ResponseBadge({
  state,
  size = "md",
  className
}: {
  state: ResponseState;
  size?: "sm" | "md";
  className?: string;
}) {
  const meta = RESPONSE_META[state];
  const tone = TONE_STYLES[meta.tone];
  return (
    <span
      className={cn("chip", tone.chip, size === "sm" && "px-2 py-0.5 text-[11px]", className)}
      title={meta.description}
    >
      <Icon name={meta.icon} className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
      {meta.label}
    </span>
  );
}

const PRIORITY_STYLES: Record<string, { chip: string; icon: string; label: string }> = {
  standard: { chip: "bg-muted text-ink-soft", icon: "circle-dot", label: "Standard" },
  elevated: { chip: "bg-warning-soft text-warning", icon: "circle-alert", label: "Elevated" },
  urgent: { chip: "bg-danger-soft text-danger", icon: "siren", label: "Urgent" }
};

export function PriorityBadge({ priority, className }: { priority: string; className?: string }) {
  const p = PRIORITY_STYLES[priority] || PRIORITY_STYLES.standard;
  return (
    <span className={cn("chip", p.chip, className)}>
      <Icon name={p.icon} className="h-3.5 w-3.5" />
      {p.label}
    </span>
  );
}
