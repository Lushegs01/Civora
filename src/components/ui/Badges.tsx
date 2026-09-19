"use client";

import { cn } from "@/lib/utils";
import { RESPONSE_META, TONE_STYLES, VERIFICATION_META } from "@/lib/states";
import type { ResponseState, VerificationState } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";
import { useLocale } from "@/components/system/LocaleProvider";
import { t } from "@/lib/i18n/i18n";

export function VerificationBadge({
  state,
  size = "md",
  className
}: {
  state: VerificationState;
  size?: "sm" | "md";
  className?: string;
}) {
  const { locale } = useLocale();
  const meta = VERIFICATION_META[state];
  const tone = TONE_STYLES[meta.tone];
  
  const label = t(`verification.${state}`, locale) || meta.label;
  const description = t(`verification.${state}.desc`, locale) || meta.description;

  return (
    <span
      className={cn("chip", tone.chip, size === "sm" && "px-2 py-0.5 text-[11px]", className)}
      title={description}
    >
      <Icon name={meta.icon} className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
      {label}
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
  const { locale } = useLocale();
  const meta = RESPONSE_META[state];
  const tone = TONE_STYLES[meta.tone];

  const label = t(`response.${state}`, locale) || meta.label;
  const description = t(`response.${state}.desc`, locale) || meta.description;

  return (
    <span
      className={cn("chip", tone.chip, size === "sm" && "px-2 py-0.5 text-[11px]", className)}
      title={description}
    >
      <Icon name={meta.icon} className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
      {label}
    </span>
  );
}

const PRIORITY_STYLES: Record<string, { chip: string; icon: string; label: string }> = {
  standard: { chip: "bg-muted text-ink-soft", icon: "circle-dot", label: "Standard" },
  elevated: { chip: "bg-warning-soft text-warning", icon: "circle-alert", label: "Elevated" },
  urgent: { chip: "bg-danger-soft text-danger", icon: "siren", label: "Urgent" }
};

export function PriorityBadge({ priority, className }: { priority: string; className?: string }) {
  const { locale } = useLocale();
  const p = PRIORITY_STYLES[priority] || PRIORITY_STYLES.standard;
  const label = t(`priority.${priority}`, locale) || p.label;
  
  return (
    <span className={cn("chip", p.chip, className)}>
      <Icon name={p.icon} className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}
