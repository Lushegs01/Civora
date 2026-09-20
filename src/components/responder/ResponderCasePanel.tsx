"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ResponderCaseView } from "@/lib/dto/case";
import type { OrganizationSummary, PublicationState, VerificationState } from "@/lib/types";
import { CATEGORY_META, PRIVACY_META } from "@/lib/types";
import { VERIFICATION_META, STATE_ORDER } from "@/lib/states";
import { PUBLICATION_DESCRIPTION, PUBLICATION_LABEL } from "@/lib/publication";
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
  | "reopen"
  | "add_note"
  | "set_publication";

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
  withPublicationSelect?: boolean;
  noteLabel: string;
  notePlaceholder: string;
  /** Copy explaining exactly who will see the text being written. */
  visibilityNote?: string;
}

export function ResponderCasePanel({
  view,
  orgs,
  viewer
}: {
  view: ResponderCaseView;
  orgs: OrganizationSummary[];
  viewer: { displayName: string; role: string; orgId: string | null };
}) {
  const router = useRouter();
  const { locale } = useLocale();
  const [dialog, setDialog] = useState<DialogSpec | null>(null);
  const [note, setNote] = useState("");
  const [publicUpdate, setPublicUpdate] = useState("");
  const [publicSummary, setPublicSummary] = useState(view.summary);
  const [orgId, setOrgId] = useState<string>(view.assignedOrgId || viewer.orgId || orgs[0]?.id || "");
  const [verification, setVerification] = useState<VerificationState>("partially_verified");
  const [publicationState, setPublicationState] = useState<PublicationState>(view.publicationState);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const closed = view.response === "closed";
  const canAcknowledge = ["received", "not_assigned"].includes(view.response);
  const proposedLinks = view.links.filter((l) => l.status === "proposed");

  function open(spec: DialogSpec) {
    setNote("");
    setPublicUpdate("");
    setError(null);
    setDialog(spec);
  }

  async function post(payload: Record<string, unknown>, successMessage?: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/responder/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId: view.id, ...payload })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || t("responder.action.error.failed", locale));
        return false;
      }
      setDialog(null);
      setFlash(successMessage || t("responder.action.flash.recorded", locale));
      router.refresh();
      setTimeout(() => setFlash(null), 6000);
      return true;
    } catch {
      setError(t("responder.action.error.failed", locale));
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function confirm() {
    if (!dialog) return;
    if (dialog.requireNote && note.trim().length < 10) {
      setError(t("responder.action.error.note", locale));
      return;
    }
    if ((dialog.kind === "add_update" || dialog.requirePublicUpdate) && publicUpdate.trim().length < 10) {
      setError(t("responder.action.error.update", locale));
      return;
    }
    await post({
      action: dialog.kind,
      note: note.trim() || undefined,
      publicUpdate: dialog.withPublicUpdate ? publicUpdate.trim() || undefined : undefined,
      orgId: dialog.withOrgSelect ? orgId || null : undefined,
      verification: dialog.withVerificationSelect ? verification : undefined,
      publicationState: dialog.withPublicationSelect ? publicationState : undefined,
      publicSummary:
        dialog.withPublicationSelect && publicSummary.trim() !== view.summary
          ? publicSummary.trim()
          : undefined
    });
  }

  const publicNote =
    t("responder.dialog.visibility.public", locale) ||
    "Everyone who can see this case reads this text. Do not include names or contact details.";
  const internalNote =
    t("responder.dialog.visibility.internal", locale) ||
    "Recorded in the audit log and visible to authorized case handlers only. Never shown publicly.";

  const dialogs: Record<ActionKind, DialogSpec> = {
    acknowledge: {
      kind: "acknowledge",
      title: t("responder.dialog.acknowledge.title", locale),
      description: t("responder.dialog.acknowledge.desc", locale),
      confirmLabel: t("responder.dialog.acknowledge.confirm", locale),
      requireNote: false,
      withPublicUpdate: true,
      noteLabel: t("responder.dialog.acknowledge.note_label", locale),
      notePlaceholder: t("responder.dialog.acknowledge.note_placeholder", locale),
      visibilityNote: internalNote
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
      notePlaceholder: t("responder.dialog.assign.note_placeholder", locale),
      visibilityNote: internalNote
    },
    start_progress: {
      kind: "start_progress",
      title: t("responder.dialog.progress.title", locale),
      description: t("responder.dialog.progress.desc", locale),
      confirmLabel: t("responder.dialog.progress.confirm", locale),
      requireNote: false,
      withPublicUpdate: true,
      noteLabel: t("responder.dialog.progress.note_label", locale),
      notePlaceholder: t("responder.dialog.progress.note_placeholder", locale),
      visibilityNote: internalNote
    },
    record_action: {
      kind: "record_action",
      title: t("responder.dialog.record.title", locale),
      description: t("responder.dialog.record.desc", locale),
      confirmLabel: t("responder.dialog.record.confirm", locale),
      requireNote: true,
      withPublicUpdate: true,
      noteLabel: t("responder.dialog.record.note_label", locale),
      notePlaceholder: t("responder.dialog.record.note_placeholder", locale),
      visibilityNote: publicNote
    },
    request_info: {
      kind: "request_info",
      title: t("responder.dialog.request.title", locale),
      description:
        t("responder.dialog.request.desc", locale) ||
        "The reporter sees this question on their case page and can reply to it there.",
      confirmLabel: t("responder.dialog.request.confirm", locale),
      requireNote: false,
      withPublicUpdate: true,
      requirePublicUpdate: true,
      noteLabel: t("responder.dialog.request.note_label", locale),
      notePlaceholder: t("responder.dialog.request.note_placeholder", locale),
      visibilityNote: publicNote
    },
    add_update: {
      kind: "add_update",
      title: t("responder.dialog.update.title", locale),
      description: t("responder.dialog.update.desc", locale),
      confirmLabel: t("responder.dialog.update.confirm", locale),
      requireNote: false,
      withPublicUpdate: true,
      noteLabel: t("responder.dialog.update.note_label", locale),
      notePlaceholder: t("responder.dialog.update.note_placeholder", locale),
      visibilityNote: publicNote
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
      notePlaceholder: t("responder.dialog.verification.note_placeholder", locale),
      visibilityNote: publicNote
    },
    close: {
      kind: "close",
      title: t("responder.dialog.close.title", locale),
      description:
        t("responder.dialog.close.desc", locale) ||
        "Closing records that a response happened. It does not by itself mark the underlying claim verified.",
      confirmLabel: t("responder.dialog.close.confirm", locale),
      requireNote: true,
      withPublicUpdate: true,
      requirePublicUpdate: true,
      noteLabel: t("responder.dialog.close.note_label", locale),
      notePlaceholder: t("responder.dialog.close.note_placeholder", locale),
      visibilityNote: publicNote
    },
    reopen: {
      kind: "reopen",
      title: t("responder.dialog.reopen.title", locale) || "Reopen this case",
      description:
        t("responder.dialog.reopen.desc", locale) ||
        "Reopening withdraws the resolved state and returns the case to in progress.",
      confirmLabel: t("responder.dialog.reopen.confirm", locale) || "Reopen case",
      requireNote: true,
      withPublicUpdate: false,
      noteLabel: t("responder.dialog.reopen.note_label", locale) || "Why is this being reopened?",
      notePlaceholder: t("responder.dialog.reopen.note_placeholder", locale),
      visibilityNote: publicNote
    },
    add_note: {
      kind: "add_note",
      title: t("responder.dialog.note.title", locale),
      description: t("responder.dialog.note.desc", locale),
      confirmLabel: t("responder.dialog.note.confirm", locale),
      requireNote: true,
      withPublicUpdate: false,
      noteLabel: t("responder.dialog.note.note_label", locale),
      notePlaceholder: t("responder.dialog.note.note_placeholder", locale),
      visibilityNote: internalNote
    },
    set_publication: {
      kind: "set_publication",
      title: t("responder.dialog.publication.title", locale) || "Publication",
      description:
        t("responder.dialog.publication.desc", locale) ||
        "Decide whether this case appears on the public community board, and what it says there.",
      confirmLabel: t("responder.dialog.publication.confirm", locale) || "Save publication",
      requireNote: false,
      withPublicUpdate: false,
      withPublicationSelect: true,
      noteLabel: t("responder.dialog.publication.note_label", locale) || "Reason (recorded in the audit log)",
      notePlaceholder: "",
      visibilityNote: internalNote
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
    { spec: dialogs.set_publication, label: t("responder.action.publication", locale) || "Publication", icon: "eye", disabled: false },
    { spec: dialogs.add_note, label: t("responder.action.internal_note", locale), icon: "lock", disabled: false },
    closed
      ? { spec: dialogs.reopen, label: t("responder.action.reopen", locale) || "Reopen case", icon: "rotate-ccw", disabled: false }
      : { spec: dialogs.close, label: t("responder.action.close_case", locale), icon: "check-circle-2", disabled: false }
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
            {t("responder.panel.case", locale)} #{view.id}
          </span>
          <span className="chip bg-muted text-ink-soft">
            <Icon name={CATEGORY_META[view.category].icon} className="h-3.5 w-3.5" />
            {t(CATEGORY_META[view.category].labelKey, locale) || CATEGORY_META[view.category].label}
          </span>
          <PriorityBadge priority={view.priority} />
          <VerificationBadge state={view.verification} />
          <ResponseBadge state={view.response} />
          <span className={`chip ${view.publicationState === "public_case" ? "bg-success-soft text-success" : "bg-warning-soft text-warning"}`}>
            <Icon name={view.publicationState === "public_case" ? "eye" : "eye-off"} className="h-3.5 w-3.5" />
            {PUBLICATION_LABEL[view.publicationState]}
          </span>
        </div>
        <h1 className="text-balance mt-3 text-[22px] font-bold leading-tight tracking-[-0.02em] text-ink md:text-[26px]">
          {view.title}
        </h1>
        <p className="mt-1.5 text-[13px] text-ink-soft">
          {view.locationGeneral || t("responder.panel.no_location", locale)} ·{" "}
          {t("responder.panel.reported", locale)} {formatDateTime(view.createdAt)} ·{" "}
          {t("responder.panel.updated", locale)} {formatDateTime(view.updatedAt)}
        </p>
      </header>

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="space-y-5">
          <section aria-label={t("responder.panel.privacy.title", locale)} className="card px-5 py-5">
            <h2 className="meta-label mb-3">{t("responder.panel.privacy.title", locale)}</h2>
            <div className="flex items-start gap-3 rounded-2xl bg-muted px-4 py-3.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface text-ink-soft">
                <Icon name={PRIVACY_META[view.privacyMode].icon} className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-ink">
                  {t(`privacy.${view.privacyMode}`, locale) || PRIVACY_META[view.privacyMode].label}
                </p>
                <p className="mt-0.5 text-[13px] leading-relaxed text-ink-soft">
                  {PRIVACY_META[view.privacyMode].body}
                </p>
                {view.reporterContact ? (
                  <dl className="mt-2.5 space-y-1 text-[13px] text-ink">
                    {view.reporterContact.name && (
                      <div>
                        <dt className="meta-label inline">{t("responder.panel.privacy.name", locale) || "Name"}: </dt>
                        <dd className="inline">{view.reporterContact.name}</dd>
                      </div>
                    )}
                    {view.reporterContact.email && (
                      <div>
                        <dt className="meta-label inline">{t("responder.panel.privacy.email", locale) || "Email"}: </dt>
                        <dd className="inline">{view.reporterContact.email}</dd>
                      </div>
                    )}
                    {view.reporterContact.phone && (
                      <div>
                        <dt className="meta-label inline">{t("responder.panel.privacy.phone", locale) || "Phone"}: </dt>
                        <dd className="inline">{view.reporterContact.phone}</dd>
                      </div>
                    )}
                    <p className="mt-1 text-xs text-ink-soft">
                      {t("responder.panel.privacy.contact_note", locale)}
                    </p>
                  </dl>
                ) : (
                  <p className="mt-2 text-xs text-ink-soft">
                    {t("responder.panel.privacy.no_contact", locale) ||
                      "No contact details are stored for this case."}
                  </p>
                )}
              </div>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-ink-soft">
              {view.counts.reports} {t("responder.panel.privacy.reports_linked", locale)} ·{" "}
              {view.counts.confirmedLinks} {t("responder.panel.confirmed_links", locale) || "confirmed related cases"}
            </p>
          </section>

          {proposedLinks.length > 0 && (
            <CorroborationPanel
              links={proposedLinks}
              busy={busy}
              onDecide={(linkId, confirmLink, reason) =>
                post(
                  { action: confirmLink ? "confirm_link" : "reject_link", linkId, note: reason },
                  confirmLink
                    ? t("responder.link.confirmed", locale) || "Corroboration confirmed."
                    : t("responder.link.rejected", locale) || "Proposed link rejected."
                )
              }
            />
          )}

          <section aria-label={t("responder.panel.summary.title", locale)} className="card px-5 py-5">
            <h2 className="meta-label mb-3">{t("responder.panel.summary.title", locale)}</h2>
            <div className="rounded-2xl border border-line bg-canvas px-4 py-3.5">
              <p className="meta-label mb-1">{t("responder.panel.public_summary", locale) || "Published summary"}</p>
              <p className="text-[13.5px] leading-relaxed text-ink">{view.summary}</p>
            </div>
            <div className="mt-3 rounded-2xl border border-warning/30 bg-warning-soft/40 px-4 py-3.5">
              <p className="meta-label mb-1 flex items-center gap-1.5">
                <Icon name="lock" className="h-3 w-3" />
                {t("responder.panel.private_report", locale) || "Reporter's own words (restricted)"}
              </p>
              <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-ink">{view.privateDescription}</p>
            </div>
            {view.screeningFlags.length > 0 && (
              <p className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-ink-soft">
                <span className="meta-label">{t("responder.panel.screening", locale) || "Screening flags"}:</span>
                {view.screeningFlags.map((f) => (
                  <span key={f} className="chip bg-muted text-ink-soft">
                    {f}
                  </span>
                ))}
              </p>
            )}
            <div className="mt-4 grid gap-2 border-t border-line pt-4 text-[13px] text-ink-soft sm:grid-cols-2">
              <p>
                <span className="meta-label block">{t("responder.panel.summary.incident_at", locale)}</span>
                {formatDateTime(view.incidentAt)}
              </p>
              <p>
                <span className="meta-label block">{t("responder.panel.summary.area", locale)}</span>
                {view.locationGeneral || t("responder.panel.summary.not_shared", locale)}
                {view.coordinates && (
                  <span className="mt-0.5 block font-mono text-[11.5px]">
                    {view.coordinates.lat.toFixed(4)}, {view.coordinates.lng.toFixed(4)}
                  </span>
                )}
              </p>
            </div>
          </section>

          <EvidenceChain evidence={view.evidence} />
          <CaseTimeline view={view} />

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
                  className={`press flex min-h-11 items-center gap-2.5 rounded-btn px-3.5 text-left text-[14px] font-medium ${
                    a.disabled
                      ? "cursor-not-allowed text-ink-soft/50"
                      : a.primary
                        ? "bg-brand text-white hover:bg-brand-deep"
                        : "bg-surface text-ink ring-1 ring-line hover:bg-muted"
                  }`}
                >
                  <Icon name={a.icon} className="h-4 w-4 shrink-0" />
                  <span className="flex-1">{a.label}</span>
                  {a.disabled && <span className="text-[11px] font-normal">{t("responder.action.done", locale)}</span>}
                </button>
              ))}
            </div>
            <p className="mt-4 border-t border-line pt-3.5 text-xs leading-relaxed text-ink-soft">
              {t("responder.panel.actions.audit", locale)} {t("responder.panel.actions.attributed", locale) || "Every action is recorded against your account:"}{" "}
              <strong className="font-semibold text-ink">{viewer.displayName}</strong>.
            </p>
          </section>

          {view.infoRequests.length > 0 && (
            <section aria-label={t("responder.panel.info.title", locale) || "Information requests"} className="card px-5 py-5">
              <h2 className="meta-label mb-3">{t("responder.panel.info.title", locale) || "Information requests"}</h2>
              <ul className="space-y-3">
                {view.infoRequests.map((r) => (
                  <li key={r.id} className="rounded-2xl bg-muted px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`chip ${r.status === "answered" ? "bg-success-soft text-success" : "bg-warning-soft text-warning"}`}>
                        {r.status === "answered"
                          ? t("responder.panel.info.answered", locale) || "Answered"
                          : t("responder.panel.info.open", locale) || "Awaiting reporter"}
                      </span>
                      <time className="text-[11px] text-ink-soft">{formatDateTime(r.createdAt)}</time>
                    </div>
                    <p className="mt-2 text-[13px] leading-relaxed text-ink">{r.message}</p>
                    {r.answerBody && (
                      <blockquote className="mt-2 rounded-xl bg-surface px-3 py-2 text-[13px] leading-relaxed text-ink-soft">
                        {r.answerBody}
                      </blockquote>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-label={t("responder.panel.verification.title", locale)} className="card px-5 py-5">
            <h2 className="meta-label mb-3">{t("responder.panel.verification.title", locale)}</h2>
            <ul className="space-y-2.5">
              {STATE_ORDER.verification.map((s) => (
                <li key={s} className={`flex gap-2.5 rounded-xl px-3 py-2 ${s === view.verification ? "bg-muted" : ""}`}>
                  <Icon name={VERIFICATION_META[s].icon} className="mt-0.5 h-4 w-4 shrink-0 text-ink-soft" />
                  <div>
                    <p className={`text-[13px] font-semibold ${s === view.verification ? "text-ink" : "text-ink-soft"}`}>
                      {t(`verification.${s}`, locale) || VERIFICATION_META[s].label}
                      {s === view.verification && (
                        <span className="ml-1.5 text-[11px] font-normal text-brand-deep">
                          {t("responder.panel.verification.current", locale)}
                        </span>
                      )}
                    </p>
                    <p className="text-[12px] leading-snug text-ink-soft">
                      {t(`verification.${s}.desc`, locale) || VERIFICATION_META[s].description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            {view.verificationReason && (
              <p className="mt-3 border-t border-line pt-3 text-[12.5px] leading-relaxed text-ink-soft">
                <span className="meta-label block">{t("responder.panel.verification.reason", locale) || "Recorded reason"}</span>
                {view.verificationReason}
              </p>
            )}
          </section>
        </div>
      </div>

      <Modal open={!!dialog} onClose={busy ? () => undefined : () => setDialog(null)} title={dialog?.title || ""}>
        {dialog && (
          <div>
            <p className="text-sm leading-relaxed text-ink-soft">{dialog.description}</p>

            {dialog.withOrgSelect && (
              <div className="mt-4">
                <label htmlFor="action-org" className="meta-label mb-1.5 block">
                  {t("responder.dialog.field.org", locale)}
                </label>
                <select id="action-org" value={orgId} onChange={(e) => setOrgId(e.target.value)} className="field">
                  <option value="">{t("responder.dialog.field.unassigned", locale) || "Unassigned queue"}</option>
                  {orgs.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                      {o.fictional ? " (fictional demo organization)" : ""}
                    </option>
                  ))}
                </select>
                {viewer.role === "responder" && (
                  <p className="mt-1.5 text-xs text-ink-soft">
                    {t("responder.dialog.field.org_scope", locale) ||
                      "You can route cases to your own organization or return them to the unassigned queue."}
                  </p>
                )}
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
                        {t(`verification.${s}`, locale) || VERIFICATION_META[s].label}
                      </option>
                    ))}
                </select>
                <p className="mt-1.5 text-xs text-ink-soft">
                  {t("responder.dialog.field.verification_note", locale) ||
                    "Resolved is only reached by closing a case with a documented outcome."}
                </p>
              </div>
            )}

            {dialog.withPublicationSelect && (
              <div className="mt-4">
                <label htmlFor="action-publication" className="meta-label mb-1.5 block">
                  {t("responder.dialog.field.publication", locale) || "Publication state"}
                </label>
                <select
                  id="action-publication"
                  value={publicationState}
                  onChange={(e) => setPublicationState(e.target.value as PublicationState)}
                  className="field"
                >
                  {(Object.keys(PUBLICATION_LABEL) as PublicationState[]).map((s) => (
                    <option key={s} value={s}>
                      {PUBLICATION_LABEL[s]}
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-xs text-ink-soft">{PUBLICATION_DESCRIPTION[publicationState]}</p>

                <label htmlFor="action-summary" className="meta-label mb-1.5 mt-4 block">
                  {t("responder.dialog.field.public_summary", locale) || "Public summary"}
                </label>
                <textarea
                  id="action-summary"
                  value={publicSummary}
                  onChange={(e) => setPublicSummary(e.target.value)}
                  rows={4}
                  maxLength={2000}
                  className="field resize-none"
                />
                <p className="mt-1.5 flex gap-1.5 text-xs text-ink-soft">
                  <Icon name="triangle-alert" className="mt-0.5 h-3 w-3 shrink-0 text-warning" />
                  {t("responder.dialog.field.summary_note", locale) ||
                    "This replaces what the public board shows. The reporter's own words are never published automatically."}
                </p>
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
                maxLength={2000}
                className="field resize-none"
                placeholder={dialog.notePlaceholder}
              />
            </div>

            {dialog.withPublicUpdate && (
              <div className="mt-3.5">
                <label htmlFor="action-public" className="meta-label mb-1.5 block">
                  {dialog.kind === "request_info"
                    ? t("responder.dialog.field.question", locale) || "Question for the reporter"
                    : t("responder.dialog.field.public_update", locale)}
                  {(dialog.kind === "add_update" || dialog.requirePublicUpdate) && <span className="text-danger"> *</span>}
                </label>
                <textarea
                  id="action-public"
                  value={publicUpdate}
                  onChange={(e) => setPublicUpdate(e.target.value)}
                  rows={3}
                  maxLength={2000}
                  className="field resize-none"
                  placeholder={t("responder.dialog.field.public_update_placeholder", locale)}
                />
                <p className="mt-1.5 flex gap-1.5 text-xs text-ink-soft">
                  <Icon name="eye" className="mt-0.5 h-3 w-3 shrink-0" />
                  {publicNote}
                </p>
              </div>
            )}

            {dialog.visibilityNote && !dialog.withPublicUpdate && (
              <p className="mt-3 flex gap-1.5 text-xs leading-relaxed text-ink-soft">
                <Icon name="lock" className="mt-0.5 h-3 w-3 shrink-0" />
                {dialog.visibilityNote}
              </p>
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

/**
 * Corroboration review.
 *
 * The matching engine only ever proposes. This is where a person looks at the
 * signals, decides, and records why — and confirming a link still does not
 * change the verification state on its own.
 */
function CorroborationPanel({
  links,
  busy,
  onDecide
}: {
  links: ResponderCaseView["links"];
  busy: boolean;
  onDecide: (linkId: string, confirm: boolean, reason: string) => Promise<boolean>;
}) {
  const { locale } = useLocale();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function decide(linkId: string, confirmLink: boolean) {
    if (reason.trim().length < 10) {
      setError(
        t("responder.link.reason_required", locale) ||
          "Record why you are confirming or rejecting this link (at least 10 characters)."
      );
      return;
    }
    const ok = await onDecide(linkId, confirmLink, reason.trim());
    if (ok) {
      setActiveId(null);
      setReason("");
      setError(null);
    }
  }

  return (
    <section
      aria-label={t("responder.link.title", locale) || "Possible corroboration"}
      className="card overflow-hidden border-info/30"
    >
      <div className="flex items-start gap-3 bg-info-soft/40 px-5 py-4">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-info text-white">
          <Icon name="search" className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-[14.5px] font-semibold text-ink">
            {t("responder.link.title", locale) || "Possible corroboration awaiting review"}
          </h2>
          <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink-soft">
            {t("responder.link.desc", locale) ||
              "Civora's matching rule found reports that resemble this case. A match is a suggestion, not a finding — nothing has been corroborated or verified until you decide."}
          </p>
        </div>
      </div>

      <ul className="divide-y divide-line">
        {links.map((link) => {
          const signals = link.signals as Record<string, number | boolean>;
          return (
            <li key={link.id} className="px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Link
                  href={`/responder/cases/${link.otherCaseId}`}
                  className="font-mono text-[13px] font-semibold text-brand-deep underline underline-offset-2"
                >
                  {link.otherCaseId}
                </Link>
                <span className="chip bg-muted text-ink-soft">
                  {t("responder.link.score", locale) || "Match score"} {Number(link.score).toFixed(2)}
                </span>
              </div>
              <p className="mt-1 text-[13.5px] font-medium text-ink">{link.otherCaseTitle}</p>

              <dl className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-1 text-[12px] text-ink-soft sm:grid-cols-4">
                <Signal label={t("responder.link.signal.location", locale) || "Location"} value={fmt(signals.locationScore)} />
                <Signal label={t("responder.link.signal.text", locale) || "Description"} value={fmt(signals.textScore)} />
                <Signal
                  label={t("responder.link.signal.time", locale) || "Time apart"}
                  value={`${fmtRaw(signals.timeProximityHours)} h`}
                />
                <Signal
                  label={t("responder.link.signal.tokens", locale) || "Shared terms"}
                  value={fmtRaw(signals.textSharedTokens)}
                />
              </dl>

              {activeId === link.id ? (
                <div className="mt-3">
                  <label htmlFor={`link-reason-${link.id}`} className="meta-label mb-1.5 block">
                    {t("responder.link.reason", locale) || "Reason (recorded on both cases)"}
                  </label>
                  <textarea
                    id={`link-reason-${link.id}`}
                    value={reason}
                    onChange={(e) => {
                      setReason(e.target.value);
                      setError(null);
                    }}
                    rows={2}
                    maxLength={2000}
                    className="field resize-none"
                  />
                  {error && (
                    <p role="alert" className="mt-1.5 text-[12px] text-danger">
                      {error}
                    </p>
                  )}
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    <button
                      onClick={() => decide(link.id, true)}
                      disabled={busy}
                      className="press inline-flex min-h-10 items-center gap-1.5 rounded-btn bg-brand px-4 text-[13.5px] font-medium text-white hover:bg-brand-deep disabled:opacity-60"
                    >
                      <Icon name="check" className="h-3.5 w-3.5" />
                      {t("responder.link.confirm", locale) || "Confirm corroboration"}
                    </button>
                    <button
                      onClick={() => decide(link.id, false)}
                      disabled={busy}
                      className="press inline-flex min-h-10 items-center gap-1.5 rounded-btn border border-line bg-surface px-4 text-[13.5px] font-medium text-ink hover:bg-muted disabled:opacity-60"
                    >
                      <Icon name="x" className="h-3.5 w-3.5" />
                      {t("responder.link.reject", locale) || "Not the same incident"}
                    </button>
                    <button
                      onClick={() => {
                        setActiveId(null);
                        setError(null);
                      }}
                      className="press min-h-10 rounded-btn px-3 text-[13.5px] font-medium text-ink-soft hover:text-ink"
                    >
                      {t("responder.dialog.cancel", locale)}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setActiveId(link.id);
                    setReason("");
                  }}
                  className="press mt-3 inline-flex min-h-10 items-center gap-1.5 rounded-btn bg-muted px-3.5 text-[13px] font-medium text-ink hover:bg-line"
                >
                  <Icon name="badge-check" className="h-3.5 w-3.5" />
                  {t("responder.link.review", locale) || "Review this match"}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Signal({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="meta-label">{label}</dt>
      <dd className="tabular-nums text-ink">{value}</dd>
    </div>
  );
}

function fmt(value: number | boolean | undefined): string {
  return typeof value === "number" ? `${Math.round(value * 100)}%` : "—";
}

function fmtRaw(value: number | boolean | undefined): string {
  return typeof value === "number" ? String(Math.round(value * 10) / 10) : "—";
}
