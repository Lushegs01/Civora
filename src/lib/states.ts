import type { ResponseState, VerificationState } from "./types";

// Verification and response are deliberately separate axes (Product Rule 6).
// Never collapse them; never render state with colour alone (icon + label always).

export interface StateMeta {
  label: string;
  icon: string;
  tone: "neutral" | "info" | "warning" | "success" | "danger";
  description: string;
}

export const VERIFICATION_META: Record<VerificationState, StateMeta> = {
  unverified: {
    label: "Unverified",
    icon: "circle-dashed",
    tone: "neutral",
    description: "Only the initial report exists. Nothing has been independently confirmed yet."
  },
  partially_verified: {
    label: "Partially verified",
    icon: "circle-dot",
    tone: "warning",
    description: "Multiple consistent reports or partial supporting evidence exist."
  },
  documented: {
    label: "Documented",
    icon: "badge-check",
    tone: "info",
    description: "A relevant primary source or strong supporting evidence documents the claim."
  },
  conflicting: {
    label: "Conflicting",
    icon: "triangle-alert",
    tone: "danger",
    description: "Evidence sources materially disagree. The discrepancy is documented, not judged."
  },
  resolved: {
    label: "Resolved",
    icon: "check-circle-2",
    tone: "success",
    description: "The case has a documented response and is considered closed."
  }
};

export const RESPONSE_META: Record<ResponseState, StateMeta> = {
  not_assigned: {
    label: "Not assigned",
    icon: "inbox",
    tone: "neutral",
    description: "No organization has taken ownership of this case yet."
  },
  received: {
    label: "Received",
    icon: "inbox",
    tone: "neutral",
    description: "The report has been received and is awaiting triage."
  },
  acknowledged: {
    label: "Acknowledged",
    icon: "mail-check",
    tone: "info",
    description: "A responsible organization has acknowledged the report."
  },
  in_progress: {
    label: "In progress",
    icon: "loader-circle",
    tone: "info",
    description: "The responsible organization is actively working on the case."
  },
  action_recorded: {
    label: "Action recorded",
    icon: "clipboard-check",
    tone: "warning",
    description: "A concrete action has been recorded against the case."
  },
  closed: {
    label: "Closed",
    icon: "check-circle-2",
    tone: "success",
    description: "The case has been closed with a documented outcome."
  }
};

export const TONE_STYLES: Record<
  StateMeta["tone"],
  { chip: string; dot: string }
> = {
  neutral: { chip: "bg-muted text-ink-soft", dot: "bg-ink-soft" },
  info: { chip: "bg-info-soft text-info", dot: "bg-info" },
  warning: { chip: "bg-warning-soft text-warning", dot: "bg-warning" },
  success: { chip: "bg-success-soft text-success", dot: "bg-success" },
  danger: { chip: "bg-danger-soft text-danger", dot: "bg-danger" }
};

export const STATE_ORDER = {
  verification: [
    "unverified",
    "partially_verified",
    "documented",
    "conflicting",
    "resolved"
  ] as VerificationState[],
  response: [
    "not_assigned",
    "received",
    "acknowledged",
    "in_progress",
    "action_recorded",
    "closed"
  ] as ResponseState[]
};
