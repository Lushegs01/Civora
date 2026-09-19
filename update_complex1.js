const fs = require('fs');
const path = require('path');

const responderCasePanelContent = `
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CaseView } from "@/lib/case-view";
import { CATEGORY_META, PRIVACY_META } from "@/lib/types";
import type { Organization } from "@/lib/types";
import { VERIFICATION_META, STATE_ORDER } from "@/lib/states";
import type { VerificationState } from "@/lib/types";
import { VerificationBadge, ResponseBadge, PriorityBadge } from "@/components/ui/Badges";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { EvidenceChain } from "@/components/case/EvidenceChain";
import { CaseTimeline } from "@/components/case/CaseTimeline";
import { formatDateTime } from "@/lib/utils";
import { useLocale } from "@/components/system/LocaleProvider";
import { t } from "@/lib/i18n/i18n";

type ActionKind =
  | "acknowledge"
  | "assign"
  | "start_progress"
  | "record_action"
  | "request_info"
  | "add_update"
  | "set_verification"
  | "close"
  | "add_note";

interface DialogSpec {
  kind: ActionKind;
  title: string;
  description: string;
  confirmLabel: string;
  requireNote: boolean;
  withPublicUpdate: boolean;
  requirePublicUpdate?: boolean;
  withOrgSelect?: boolean;
  withVerificationSelect?: boolean;
  noteLabel: string;
  notePlaceholder: string;
}

export function ResponderCasePanel({ view, orgs }: { view: CaseView; orgs: Organization[] }) {
  const router = useRouter();
  const c = view.case;
  const [dialog, setDialog] = useState<DialogSpec | null>(null);
  const [note, setNote] = useState("");
  const [publicUpdate, setPublicUpdate] = useState("");
  const [orgId, setOrgId] = useState(c.assignedOrgId || orgs[0]?.id || "");
  const [verification, setVerification] = useState<VerificationState>("partially_verified");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const { locale } = useLocale();

  const closed = c.response === "closed";
  const canAcknowledge = ["received", "not_assigned"].includes(c.response);

  function open(spec: DialogSpec) {
    setNote("");
    setPublicUpdate("");
    setError(null);
    setDialog(spec);
  }

  async function confirm() {
    if (!dialog) return;
    if (dialog.requireNote && !note.trim()) {
      setError(t("responder.action.error.note", locale));
      return;
    }
    if ((dialog.kind === "add_update" || dialog.requirePublicUpdate) && !publicUpdate.trim()) {
      setError(t("responder.action.error.update", locale));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/responder/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId: c.id,
          action: dialog.kind,
          note: note.trim() || undefined,
          publicUpdate: dialog.withPublicUpdate ? publicUpdate.trim() || undefined : undefined,
          orgId: dialog.withOrgSelect ? orgId : undefined,
          verification: dialog.withVerificationSelect ? verification : undefined
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || t("responder.action.error.failed", locale));
        return;
      }
      setDialog(null);
      setFlash(t("responder.action.flash.recorded", locale));
      router.refresh();
      setTimeout(() => setFlash(null), 6000);
    } finally {
      setBusy(false);
    }
  }

  const dialogs: Record<ActionKind, DialogSpec> = {
    acknowledge: {
      kind: "acknowledge",
      title: t("responder.dialog.acknowledge.title", locale),
      description: t("responder.dialog.acknowledge.desc", locale),
      confirmLabel: t("responder.dialog.acknowledge.confirm", locale),
      requireNote: false,
      withPublicUpdate: true,
      noteLabel: t("responder.dialog.acknowledge.note_label", locale),
      notePlaceholder: t("responder.dialog.acknowledge.note_placeholder", locale)
    },
    assign: {
      kind: "assign",
      title: t("responder.dialog.assign.title", locale),
      description: t("responder.dialog.assign.desc", locale),
      confirmLabel: t("responder.dialog.assign.confirm", locale),
      requireNote: false,
      withPublicUpdate: false,
      withOrgSelect: true,
      noteLabel: t("responder.dialog.assign.note_label", locale),
      notePlaceholder: t("responder.dialog.assign.note_placeholder", locale)
    },
    start_progress: {
      kind: "start_progress",
      title: t("responder.dialog.progress.title", locale),
      description: t("responder.dialog.progress.desc", locale),
      confirmLabel: t("responder.dialog.progress.confirm", locale),
      requireNote: false,
      withPublicUpdate: true,
      noteLabel: t("responder.dialog.progress.note_label", locale),
      notePlaceholder: t("responder.dialog.progress.note_placeholder", locale)
    },
    record_action: {
      kind: "record_action",
      title: t("responder.dialog.record.title", locale),
      description: t("responder.dialog.record.desc", locale),
      confirmLabel: t("responder.dialog.record.confirm", locale),
      requireNote: true,
      withPublicUpdate: true,
      noteLabel: t("responder.dialog.record.note_label", locale),
      notePlaceholder: t("responder.dialog.record.note_placeholder", locale)
    },
    request_info: {
      kind: "request_info",
      title: t("responder.dialog.request.title", locale),
      description: t("responder.dialog.request.desc", locale),
      confirmLabel: t("responder.dialog.request.confirm", locale),
      requireNote: false,
      withPublicUpdate: true,
      noteLabel: t("responder.dialog.request.note_label", locale),
      notePlaceholder: t("responder.dialog.request.note_placeholder", locale)
    },
    add_update: {
      kind: "add_update",
      title: t("responder.dialog.update.title", locale),
      description: t("responder.dialog.update.desc", locale),
      confirmLabel: t("responder.dialog.update.confirm", locale),
      requireNote: false,
      withPublicUpdate: true,
      noteLabel: t("responder.dialog.update.note_label", locale),
      notePlaceholder: t("responder.dialog.update.note_placeholder", locale)
    },
    set_verification: {
      kind: "set_verification",
      title: t("responder.dialog.verification.title", locale),
      description: t("responder.dialog.verification.desc", locale),
      confirmLabel: t("responder.dialog.verification.confirm", locale),
      requireNote: true,
      withPublicUpdate: false,
      withVerificationSelect: true,
      noteLabel: t("responder.dialog.verification.note_label", locale),
      notePlaceholder: t("responder.dialog.verification.note_placeholder", locale)
    },
    close: {
      kind: "close",
      title: t("responder.dialog.close.title", locale),
      description: t("responder.dialog.close.desc", locale),
      confirmLabel: t("responder.dialog.close.confirm", locale),
      requireNote: true,
      withPublicUpdate: true,
      requirePublicUpdate: true,
      noteLabel: t("responder.dialog.close.note_label", locale),
      notePlaceholder: t("responder.dialog.close.note_placeholder", locale)
    },
    add_note: {
      kind: "add_note",
      title: t("responder.dialog.note.title", locale),
      description: t("responder.dialog.note.desc", locale),
      confirmLabel: t("responder.dialog.note.confirm", locale),
      requireNote: true,
      withPublicUpdate: false,
      noteLabel: t("responder.dialog.note.note_label", locale),
      notePlaceholder: t("responder.dialog.note.note_placeholder", locale)
    }
  };

  const actions: Array<{ spec: DialogSpec; label: string; icon: string; primary?: boolean; disabled?: boolean }> = [
    { spec: dialogs.acknowledge, label: t("responder.action.acknowledge", locale), icon: "mail-check", primary: true, disabled: !canAcknowledge || closed },
    { spec: dialogs.assign, label: t("responder.action.assign", locale), icon: "building", disabled: closed },
    { spec: dialogs.start_progress, label: t("responder.action.start_progress", locale), icon: "loader-circle", disabled: closed },
    { spec: dialogs.record_action, label: t("responder.action.record_action", locale), icon: "clipboard-check", disabled: closed },
    { spec: dialogs.request_info, label: t("responder.action.request_info", locale), icon: "message", disabled: closed },
    { spec: dialogs.add_update, label: t("responder.action.add_update", locale), icon: "scroll-text", disabled: closed },
    { spec: dialogs.set_verification, label: t("responder.action.verification", locale), icon: "badge-check", disabled: closed },
    { spec: dialogs.add_note, label: t("responder.action.internal_note", locale), icon: "lock", disabled: false },
    { spec: dialogs.close, label: t("responder.action.close_case", locale), icon: "check-circle-2", disabled: closed }
  ];

  return (
    <main className="mx-auto max-w-content px-4 py-5 md:px-8 md:py-8">
      <Link
        href="/responder"
        className="press inline-flex min-h-11 items-center gap-1.5 rounded-btn px-2 text-[13.5px] font-medium text-ink-soft hover:text-ink"
      >
        <Icon name="chevron-left" className="h-4 w-4" />
        {t("responder.panel.back", locale)}
      </Link>

      {flash && (
        <p role="status" className="mt-3 rounded-xl bg-success-soft px-3.5 py-2.5 text-[13px] font-medium text-success">
          {flash}
        </p>
      )}

      <header className="mt-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-brand-soft px-3 py-1 font-mono text-[12.5px] font-semibold text-brand-deep">
            {t("responder.panel.case", locale)} #{c.id}
          </span>
          <span className="chip bg-muted text-ink-soft">
            <Icon name={CATEGORY_META[c.category].icon} className="h-3.5 w-3.5" />
            {t(\`category.\${c.category}\`, locale) || CATEGORY_META[c.category].label}
          </span>
          <PriorityBadge priority={c.priority} />
          <VerificationBadge state={c.verification} />
          <ResponseBadge state={c.response} />
        </div>
        <h1 className="text-balance mt-3 text-[22px] font-bold leading-tight tracking-[-0.02em] text-ink md:text-[26px]">
          {c.title}
        </h1>
        <p className="mt-1.5 text-[13px] text-ink-soft">
          {c.locationGeneral || t("responder.panel.no_location", locale)} · {t("responder.panel.reported", locale)} {formatDateTime(c.createdAt)} ·
          {t("responder.panel.updated", locale)} {formatDateTime(c.updatedAt)}
        </p>
      </header>

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="space-y-5">
          <section aria-label={t("responder.panel.privacy.title", locale)} className="card px-5 py-5">
            <h2 className="meta-label mb-3">{t("responder.panel.privacy.title", locale)}</h2>
            <div className="flex items-start gap-3 rounded-2xl bg-muted px-4 py-3.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface text-ink-soft">
                <Icon name={PRIVACY_META[c.privacyMode].icon} className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[14px] font-semibold text-ink">{t(\`privacy.\${c.privacyMode}\`, locale) || PRIVACY_META[c.privacyMode].label}</p>
                <p className="mt-0.5 text-[13px] leading-relaxed text-ink-soft">
                  {c.privacyMode === "anonymous"
                    ? t("responder.panel.privacy.anon_desc", locale)
                    : t(\`privacy.\${c.privacyMode}.desc\`, locale) || PRIVACY_META[c.privacyMode].body}
                </p>
                {c.reporterContact && (
                  <p className="mt-1.5 text-[13px] text-ink">
                    <span className="meta-label">{t("responder.panel.privacy.auth_contact", locale)}</span>
                    {c.reporterContact}
                    <span className="mt-0.5 block text-xs text-ink-soft">
                      {t("responder.panel.privacy.contact_note", locale)}
                    </span>
                  </p>
                )}
              </div>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-ink-soft">
              {c.reports.length} {t("responder.panel.privacy.reports_linked", locale)} ·{" "}
              {c.reports.filter((r) => r.role === "corroborating").length} {t("responder.panel.privacy.corroborating", locale)}
            </p>
          </section>

          <section aria-label={t("responder.panel.summary.title", locale)} className="card px-5 py-5">
            <h2 className="meta-label mb-3">{t("responder.panel.summary.title", locale)}</h2>
            <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-ink">{c.description}</p>
            <div className="mt-4 grid gap-2 border-t border-line pt-4 text-[13px] text-ink-soft sm:grid-cols-2">
              <p>
                <span className="meta-label block">{t("responder.panel.summary.incident_at", locale)}</span>
                {formatDateTime(c.incidentAt)}
              </p>
              <p>
                <span className="meta-label block">{t("responder.panel.summary.area", locale)}</span>
                {c.locationGeneral || t("responder.panel.summary.not_shared", locale)}
              </p>
            </div>
          </section>

          <EvidenceChain evidence={view.evidence} canSeeRestricted />
          <CaseTimeline view={view} showRestricted />

          <section aria-label={t("responder.panel.notes.title", locale)} className="card px-5 py-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="meta-label">{t("responder.panel.notes.title", locale)}</h2>
              <button
                onClick={() => open(dialogs.add_note)}
                className="press inline-flex min-h-9 items-center gap-1.5 rounded-btn bg-muted px-3 text-[12.5px] font-medium text-ink hover:bg-line"
              >
                <Icon name="plus" className="h-3.5 w-3.5" /> {t("responder.panel.notes.add", locale)}
              </button>
            </div>
            {view.notes.length === 0 ? (
              <p className="text-sm text-ink-soft">{t("responder.panel.notes.empty", locale)}</p>
            ) : (
              <ul className="space-y-3">
                {view.notes.map((n) => (
                  <li key={n.id} className="rounded-2xl bg-muted px-4 py-3">
                    <p className="text-[13.5px] leading-relaxed text-ink">{n.body}</p>
                    <p className="mt-1.5 text-xs text-ink-soft">
                      {n.authorLabel} · {formatDateTime(n.at)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="space-y-5">
          <section aria-label={t("responder.panel.actions.title", locale)} className="card px-5 py-5">
            <h2 className="meta-label mb-4">{t("responder.panel.actions.title", locale)}</h2>
            <div className="flex flex-col gap-2">
              {actions.map((a) => (
                <button
                  key={a.spec.kind}
                  onClick={() => open(a.spec)}
                  disabled={a.disabled}
                  className={\`press flex min-h-11 items-center gap-2.5 rounded-btn px-3.5 text-left text-[14px] font-medium \${
                    a.disabled
                      ? "cursor-not-allowed text-ink-soft/50"
                      : a.primary
                        ? "bg-brand text-white hover:bg-brand-deep"
                        : "bg-surface text-ink ring-1 ring-line hover:bg-muted"
                  }\`}
                >
                  <Icon name={a.icon} className="h-4 w-4 shrink-0" />
                  <span className="flex-1">{a.label}</span>
                  {a.disabled && <span className="text-[11px] font-normal">{t("responder.action.done", locale)}</span>}
                </button>
              ))}
            </div>
            <p className="mt-4 border-t border-line pt-3.5 text-xs leading-relaxed text-ink-soft">
              {t("responder.panel.actions.audit", locale)}
            </p>
          </section>

          <section aria-label={t("responder.panel.verification.title", locale)} className="card px-5 py-5">
            <h2 className="meta-label mb-3">{t("responder.panel.verification.title", locale)}</h2>
            <ul className="space-y-2.5">
              {STATE_ORDER.verification.map((s) => (
                <li key={s} className={\`flex gap-2.5 rounded-xl px-3 py-2 \${s === c.verification ? "bg-muted" : ""}\`}>
                  <Icon name={VERIFICATION_META[s].icon} className="mt-0.5 h-4 w-4 shrink-0 text-ink-soft" />
                  <div>
                    <p className={\`text-[13px] font-semibold \${s === c.verification ? "text-ink" : "text-ink-soft"}\`}>
                      {t(\`verification.\${s}\`, locale) || VERIFICATION_META[s].label}
                      {s === c.verification && <span className="ml-1.5 text-[11px] font-normal text-brand-deep">{t("responder.panel.verification.current", locale)}</span>}
                    </p>
                    <p className="text-[12px] leading-snug text-ink-soft">{t(\`verification.\${s}.desc\`, locale) || VERIFICATION_META[s].description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      <Modal
        open={!!dialog}
        onClose={busy ? () => {} : () => setDialog(null)}
        title={dialog?.title || ""}
      >
        {dialog && (
          <div>
            <p className="text-sm leading-relaxed text-ink-soft">{dialog.description}</p>

            {dialog.withOrgSelect && (
              <div className="mt-4">
                <label htmlFor="action-org" className="meta-label mb-1.5 block">
                  {t("responder.dialog.field.org", locale)}
                </label>
                <select
                  id="action-org"
                  value={orgId}
                  onChange={(e) => setOrgId(e.target.value)}
                  className="field"
                >
                  {orgs.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {dialog.withVerificationSelect && (
              <div className="mt-4">
                <label htmlFor="action-verification" className="meta-label mb-1.5 block">
                  {t("responder.dialog.field.new_verification", locale)}
                </label>
                <select
                  id="action-verification"
                  value={verification}
                  onChange={(e) => setVerification(e.target.value as VerificationState)}
                  className="field"
                >
                  {STATE_ORDER.verification
                    .filter((s) => s !== "resolved")
                    .map((s) => (
                      <option key={s} value={s}>
                        {t(\`verification.\${s}\`, locale) || VERIFICATION_META[s].label}
                      </option>
                    ))}
                </select>
              </div>
            )}

            <div className="mt-4">
              <label htmlFor="action-note" className="meta-label mb-1.5 block">
                {dialog.noteLabel}
                {dialog.requireNote && <span className="text-danger"> *</span>}
              </label>
              <textarea
                id="action-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                maxLength={1000}
                className="field resize-none"
                placeholder={dialog.notePlaceholder}
              />
            </div>

            {dialog.withPublicUpdate && (
              <div className="mt-3.5">
                <label htmlFor="action-public" className="meta-label mb-1.5 block">
                  {t("responder.dialog.field.public_update", locale)}
                  {(dialog.kind === "add_update" || dialog.requirePublicUpdate) && <span className="text-danger"> *</span>}
                </label>
                <textarea
                  id="action-public"
                  value={publicUpdate}
                  onChange={(e) => setPublicUpdate(e.target.value)}
                  rows={3}
                  maxLength={1000}
                  className="field resize-none"
                  placeholder={t("responder.dialog.field.public_update_placeholder", locale)}
                />
                <p className="mt-1.5 text-xs text-ink-soft">
                  {publicUpdate.trim()
                    ? \`\${t("responder.dialog.field.preview", locale)} “\${publicUpdate.trim()}”\`
                    : (dialog.kind === "add_update" || dialog.requirePublicUpdate) 
                        ? t("responder.dialog.field.required", locale) 
                        : t("responder.dialog.field.optional", locale)}
                </p>
              </div>
            )}

            {error && (
              <p role="alert" className="mt-3 rounded-xl bg-danger-soft px-3.5 py-2.5 text-[13px] text-danger">
                {error}
              </p>
            )}

            <div className="mt-5 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
              <button
                onClick={() => setDialog(null)}
                disabled={busy}
                className="press min-h-11 rounded-btn border border-line bg-surface px-5 text-[15px] font-medium text-ink hover:bg-muted disabled:opacity-50"
              >
                {t("responder.dialog.cancel", locale)}
              </button>
              <button
                onClick={confirm}
                disabled={busy}
                className="press inline-flex min-h-11 items-center justify-center gap-2 rounded-btn bg-brand px-5 text-[15px] font-medium text-white hover:bg-brand-deep disabled:opacity-60"
              >
                {busy && <Icon name="loader-circle" className="h-4 w-4 animate-spin" />}
                {dialog.confirmLabel}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </main>
  );
}
`;

fs.writeFileSync("c:\\Users\\LUSHEGS\\Desktop\\Civora\\src\\components\\responder\\ResponderCasePanel.tsx", responderCasePanelContent.trim() + "\\n");

const topBarContent = `
"use client";

import Link from "next/link";
import { CivoraLogo } from "@/components/CivoraLogo";
import { useLocale } from "@/components/system/LocaleProvider";
import { t } from "@/lib/i18n/i18n";

export function TopBar({ action }: { action?: React.ReactNode }) {
  const { locale } = useLocale();
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas/90 backdrop-blur md:hidden">
      <div className="flex h-14 items-center justify-between px-4">
        <Link href="/home" aria-label={t("nav.home", locale) || "Civora home"} className="press rounded-lg">
          <CivoraLogo size={30} />
        </Link>
        {action}
      </div>
    </header>
  );
}
`;
fs.writeFileSync("c:\\Users\\LUSHEGS\\Desktop\\Civora\\src\\components\\shell\\TopBar.tsx", topBarContent.trim() + "\\n");

// For responder/page.tsx, extract to client wrapper ResponderDashboardClient.tsx
const responderDashboardClientContent = `
"use client";

import Link from "next/link";
import { CATEGORY_META, isResolved } from "@/lib/types";
import { VERIFICATION_META, RESPONSE_META, TONE_STYLES } from "@/lib/states";
import { VerificationBadge, ResponseBadge, PriorityBadge } from "@/components/ui/Badges";
import { Icon } from "@/components/ui/Icon";
import { relativeTime } from "@/lib/utils";
import { useLocale } from "@/components/system/LocaleProvider";
import { t } from "@/lib/i18n/i18n";

export function ResponderDashboardClient({ cases, orgCount }: { cases: any[], orgCount: number }) {
  const { locale } = useLocale();

  const open = cases.filter((c) => !isResolved(c));
  const metrics = [
    { label: t("responder.dashboard.metrics.new", locale), value: cases.filter((c) => ["received", "not_assigned"].includes(c.response)).length, tone: "bg-brand-soft text-brand-deep", icon: "inbox" },
    { label: t("responder.dashboard.metrics.verification", locale), value: cases.filter((c) => c.verification === "unverified" && !isResolved(c)).length, tone: "bg-warning-soft text-warning", icon: "badge-check" },
    { label: t("responder.dashboard.metrics.assigned", locale), value: cases.filter((c) => c.assignedOrgId && !isResolved(c)).length, tone: "bg-info-soft text-info", icon: "building" },
    { label: t("responder.dashboard.metrics.in_progress", locale), value: cases.filter((c) => ["in_progress", "action_recorded"].includes(c.response)).length, tone: "bg-info-soft text-info", icon: "loader-circle" },
    { label: t("responder.dashboard.metrics.resolved", locale), value: cases.filter((c) => isResolved(c)).length, tone: "bg-success-soft text-success", icon: "check-circle-2" }
  ];

  const sorted = [...cases].sort((a, b) => {
    const rank = (c: any) =>
      (c.priority === "urgent" ? 0 : c.priority === "elevated" ? 1 : 2) * 10 +
      (c.response === "received" || c.response === "not_assigned" ? 0 : 1);
    return rank(a) - rank(b) || +new Date(b.updatedAt) - +new Date(a.updatedAt);
  });

  return (
    <main className="mx-auto max-w-content px-4 py-6 md:px-8 md:py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-bold tracking-[-0.02em] text-ink md:text-[28px]">
            {t("responder.dashboard.title", locale)}
          </h1>
          <p className="mt-1.5 text-[14px] text-ink-soft">
            {open.length} {open.length === 1 ? t("responder.dashboard.open_case", locale) : t("responder.dashboard.open_cases", locale)} {t("responder.dashboard.across", locale)} {orgCount} {t("responder.dashboard.configured_orgs", locale)}
          </p>
        </div>
        <Link
          href="/cases/CS-1042"
          className="press inline-flex min-h-10 items-center gap-1.5 rounded-btn bg-brand-soft px-3.5 text-[13px] font-medium text-brand-deep hover:bg-brand/15"
        >
          <Icon name="sparkles" className="h-4 w-4" />
          {t("responder.dashboard.primary_demo", locale)}
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {metrics.map((m) => (
          <div key={m.label} className="card px-4 py-4">
            <span className={\`flex h-8 w-8 items-center justify-center rounded-full \${m.tone}\`}>
              <Icon name={m.icon} className="h-4 w-4" />
            </span>
            <p className="mt-3 text-[26px] font-bold leading-none tracking-[-0.02em] text-ink">
              {m.value}
            </p>
            <p className="mt-1.5 text-[12.5px] font-medium text-ink-soft">{m.label}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-8 text-[18px] font-semibold tracking-[-0.01em] text-ink">{t("responder.dashboard.cases.title", locale)}</h2>
      <div className="mt-3 card divide-y divide-line overflow-hidden">
        {sorted.map((c) => {
          const cat = CATEGORY_META[c.category as keyof typeof CATEGORY_META];
          const vm = VERIFICATION_META[c.verification as keyof typeof VERIFICATION_META];
          const rm = RESPONSE_META[c.response as keyof typeof RESPONSE_META];
          return (
            <Link
              key={c.id}
              href={\`/responder/cases/\${c.id}\`}
              className="press grid grid-cols-2 items-center gap-x-4 gap-y-2 px-4 py-4 hover:bg-muted/50 sm:grid-cols-[110px_1fr_150px_150px_110px] md:px-5"
            >
              <div className="col-span-2 flex items-center gap-2.5 sm:col-span-1">
                <span className="font-mono text-[13px] font-semibold text-ink">{c.id}</span>
                <PriorityBadge priority={c.priority} />
              </div>
              <div className="col-span-2 min-w-0 sm:col-span-1">
                <p className="truncate text-[14px] font-semibold text-ink">{c.title}</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-soft">
                  <Icon name={cat.icon} className="h-3 w-3" />
                  {t(\`category.\${c.category}\`, locale) || cat.label}
                  {c.locationGeneral && <span className="truncate">· {c.locationGeneral}</span>}
                </p>
              </div>
              <div className="col-span-1">
                <span className={\`chip \${TONE_STYLES[vm.tone].chip} w-full justify-center sm:justify-start\`}>
                  <Icon name={vm.icon} className="h-3 w-3" />
                  {t(\`verification.\${c.verification}\`, locale) || vm.label}
                </span>
              </div>
              <div className="col-span-1">
                <span className={\`chip \${TONE_STYLES[rm.tone].chip} w-full justify-center sm:justify-start\`}>
                  <Icon name={rm.icon} className="h-3 w-3" />
                  {t(\`response.\${c.response}\`, locale) || rm.label}
                </span>
              </div>
              <div className="col-span-2 flex items-center justify-between sm:col-span-1 sm:justify-end">
                <span className="text-xs text-ink-soft sm:text-right">
                  {relativeTime(c.updatedAt)}
                </span>
                <Icon name="chevron-right" className="h-4 w-4 text-ink-soft/60 sm:hidden" />
              </div>
            </Link>
          );
        })}
      </div>
      <p className="mt-3 px-1 text-xs text-ink-soft">
        {t("responder.dashboard.cases.note", locale)}
      </p>
    </main>
  );
}
`;
fs.writeFileSync("c:\\Users\\LUSHEGS\\Desktop\\Civora\\src\\app\\responder\\ResponderDashboardClient.tsx", responderDashboardClientContent.trim() + "\\n");

const responderServerContent = `
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isResponder } from "@/lib/auth/session";
import { readDb } from "@/lib/db/store";
import { ResponderDashboardClient } from "./ResponderDashboardClient";

export const metadata: Metadata = { title: "Responder workspace" };
export const dynamic = "force-dynamic";

export default async function ResponderDashboard() {
  if (!isResponder(cookies())) redirect("/responder/access");

  const db = await readDb();

  return <ResponderDashboardClient cases={db.cases} orgCount={db.orgs.length} />;
}
`;
fs.writeFileSync("c:\\Users\\LUSHEGS\\Desktop\\Civora\\src\\app\\responder\\page.tsx", responderServerContent.trim() + "\\n");

console.log("Complex files part 1 updated.");
