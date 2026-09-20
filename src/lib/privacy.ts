import type { PrivacyMode } from "@prisma/client";

// Every label that can reach a public surface comes from this fixed
// vocabulary. A reporter's name can therefore never be interpolated into an
// event actor, an evidence source or a case description by accident.

export const PUBLIC_REPORTER_LABEL: Record<PrivacyMode, string> = {
  anonymous: "Anonymous reporter",
  confidential: "Confidential reporter",
  identified: "Identified reporter"
};

export const PUBLIC_EVIDENCE_LABEL: Record<PrivacyMode, string> = {
  anonymous: "Citizen report (anonymous)",
  confidential: "Citizen report (confidential)",
  identified: "Citizen report (identified)"
};

export const SYSTEM_LABELS = {
  matchingRule: "Civora matching rule",
  responseDesk: "Response desk",
  reporterViaTracking: "Reporter (via tracking link)",
  system: "Civora"
} as const;

/**
 * True when an actor label is safe to publish.
 *
 * Used as a last-line assertion before a public event is written: if a label
 * is not one of the fixed strings, an organization name, or a responder's
 * professional display name, the caller is doing something it shouldn't.
 */
export function isPublicSafeLabel(label: string, allowed: readonly string[]): boolean {
  return allowed.includes(label);
}

/** Does this privacy mode permit storing identity at all? */
export function storesIdentity(mode: PrivacyMode): boolean {
  return mode !== "anonymous";
}

/**
 * Who may read the reporter's contact details.
 * Anonymous reports have none stored, so the answer is always "nobody".
 */
export function contactVisibleToHandlers(mode: PrivacyMode): boolean {
  return mode === "confidential" || mode === "identified";
}

const EMAIL = /\b[\w.+-]+@[\w-]+\.[\w.-]{2,}\b/g;
const PHONE = /(?:(?:\+|00)\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?){2,4}\d{2,4}/g;
const ID_NUMBER = /\b(?:[A-Z]{2,4}[-\s]?)?\d{6,}\b/g;

export interface PersonalDataScan {
  hasEmail: boolean;
  hasPhone: boolean;
  hasIdNumber: boolean;
  /** Non-empty when the text should not be auto-published. */
  flags: string[];
}

/**
 * Heuristic scan for personal data inside free text.
 *
 * Deliberately conservative and advisory: it flags a report for screening, it
 * never rewrites what the reporter wrote and never claims the text is clean.
 */
export function scanForPersonalData(text: string): PersonalDataScan {
  const hasEmail = new RegExp(EMAIL.source, "g").test(text);
  const hasPhone = new RegExp(PHONE.source, "g").test(text);
  const hasIdNumber = new RegExp(ID_NUMBER.source, "g").test(text);
  const flags: string[] = [];
  if (hasEmail) flags.push("contains-email");
  if (hasPhone) flags.push("contains-phone-number");
  if (hasIdNumber) flags.push("contains-identifier");
  return { hasEmail, hasPhone, hasIdNumber, flags };
}
