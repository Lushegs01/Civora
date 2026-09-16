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
      setError("A short description is required — it becomes part of the case record.");
      return;
    }
    if (dialog.kind === "add_update" && !publicUpdate.trim()) {
      setError("Write the public update before posting it.");
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
        setError(data?.error || "That action could not be completed. Please try again.");
        return;
      }
      setDialog(null);
      setFlash("Action recorded on the case timeline.");
      router.refresh();
      setTimeout(() => setFlash(null), 6000);
    } finally {
      setBusy(false);
    }
  }

  const dialogs: Record<ActionKind, DialogSpec> = {
    acknowledge: {
      kind: "acknowledge",
      title: "Acknowledge this case?",
      description:
        "Acknowledgement is public — the reporter and community will see that the responsible organization has received the report.",
      confirmLabel: "Acknowledge case",
      requireNote: false,
      withPublicUpdate: true,
      noteLabel: "Internal note (optional)",
      notePlaceholder: "Context for the response desk — not shown publicly"
    },
    assign: {
      kind: "assign",
      title: "Assign this case",
      description: "Route the case to the organization responsible for responding.",
      confirmLabel: "Assign case",
      requireNote: false,
      withPublicUpdate: false,
      withOrgSelect: true,
      noteLabel: "Routing note (optional)",
      notePlaceholder: "Why this organization"
    },
    start_progress: {
      kind: "start_progress",
      title: "Mark response in progress?",
      description:
        "Signals to everyone following the case that work has started. A public update is recommended.",
      confirmLabel: "Mark in progress",
      requireNote: false,
      withPublicUpdate: true,
      noteLabel: "Internal note (optional)",
      notePlaceholder: "What is being done"
    },
    record_action: {
      kind: "record_action",
      title: "Record action taken",
      description:
        "Describe the concrete action taken. This becomes a permanent, public part of the case record.",
      confirmLabel: "Record action",
      requireNote: true,
      withPublicUpdate: true,
      noteLabel: "Action description",
      notePlaceholder: "e.g. Electrical contractor inspected the panel and isolated the circuit"
    },
    request_info: {
      kind: "request_info",
      title: "Request more information",
      description:
        "The case will show that additional information has been requested from the reporter.",
      confirmLabel: "Request information",
      requireNote: false,
      withPublicUpdate: true,
      noteLabel: "What is needed (optional)",
      notePlaceholder: "e.g. Photo of the panel in daylight would help the inspection"
    },
    add_update: {
      kind: "add_update",
      title: "Add a public update",
      description:
        "Updates are shown to everyone following the case. Keep them factual and calm; never name individuals.",
      confirmLabel: "Publish update",
      requireNote: false,
      withPublicUpdate: true,
      noteLabel: "Internal note (optional)",
      notePlaceholder: "Context for the response desk"
    },
    set_verification: {
      kind: "set_verification",
      title: "Change verification state",
      description:
        "Verification reflects documented evidence — never a judgment about anyone. State the evidence basis in the note.",
      confirmLabel: "Update verification",
      requireNote: true,
      withPublicUpdate: false,
      withVerificationSelect: true,
      noteLabel: "Evidence basis",
      notePlaceholder: "e.g. Two consistent reports plus a dated photo refer to the same panel"
    },
    close: {
      kind: "close",
      title: "Close this case?",
      description:
        "Closing sets verification to Resolved and records the outcome publicly. This cannot be casually undone in the demo.",
      confirmLabel: "Close case",
      requireNote: true,
      withPublicUpdate: true,
      noteLabel: "Resolution summary",
      notePlaceholder: "e.g. Fault repaired and tested; walkway reopened"
    },
    add_note: {
      kind: "add_note",
      title: "Add internal note",
      description:
        "Responder-only. Never shown publicly. Use for coordination between handlers.",
      confirmLabel: "Add note",
      requireNote: true,
      withPublicUpdate: false,
      noteLabel: "Note",
      notePlaceholder: "e.g. Contractor scheduled for tomorrow 08:00"
    }
  };

  const actions: Array<{ spec: DialogSpec; label: string; icon: string; primary?: boolean; disabled?: boolean }> = [
    { spec: dialogs.acknowledge, label: "Accept & acknowledge", icon: "mail-check", primary: true, disabled: !canAcknowledge || closed },
    { spec: dialogs.assign, label: "Assign", icon: "building", disabled: closed },
    { spec: dialogs.start_progress, label: "Start progress", icon: "loader-circle", disabled: closed },
    { spec: dialogs.record_action, label: "Record action", icon: "clipboard-check", disabled: closed },
    { spec: dialogs.request_info, label: "Request info", icon: "message", disabled: closed },
    { spec: dialogs.add_update, label: "Public update", icon: "scroll-text", disabled: closed },
    { spec: dialogs.set_verification, label: "Verification", icon: "badge-check", disabled: closed },
    { spec: dialogs.add_note, label: "Internal note", icon: "lock", disabled: false },
    { spec: dialogs.close, label: "Close case", icon: "check-circle-2", disabled: closed }
  ];

  return (
    <main className="mx-auto max-w-content px-4 py-5 md:px-8 md:py-8">
      <Link
        href="/responder"
        className="press inline-flex min-h-11 items-center gap-1.5 rounded-btn px-2 text-[13.5px] font-medium text-ink-soft hover:text-ink"
      >
        <Icon name="chevron-left" className="h-4 w-4" />
        Response overview
      </Link>

      {flash && (
        <p role="status" className="mt-3 rounded-xl bg-success-soft px-3.5 py-2.5 text-[13px] font-medium text-success">
          {flash}
        </p>
      )}

      {/* Header */}
      <header className="mt-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-ink px-3 py-1 font-mono text-[12.5px] font-semibold text-white">
            CASE #{c.id}
          </span>
          <span className="chip bg-muted text-ink-soft">
            <Icon name={CATEGORY_META[c.category].icon} className="h-3.5 w-3.5" />
            {CATEGORY_META[c.category].label}
          </span>
          <PriorityBadge priority={c.priority} />
          <VerificationBadge state={c.verification} />
          <ResponseBadge state={c.response} />
        </div>
        <h1 className="text-balance mt-3 text-[22px] font-bold leading-tight tracking-[-0.02em] text-ink md:text-[26px]">
          {c.title}
        </h1>
        <p className="mt-1.5 text-[13px] text-ink-soft">
          {c.locationGeneral || "No location shared"} · reported {formatDateTime(c.createdAt)} ·
          updated {formatDateTime(c.updatedAt)}
        </p>
      </header>

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_400px]">
        {/* Left column */}
        <div className="space-y-5">
          {/* Reporter privacy state — no identity exposure */}
          <section aria-label="Reporter privacy" className="card px-5 py-5">
            <h2 className="meta-label mb-3">Reporter privacy state</h2>
            <div className="flex items-start gap-3 rounded-2xl bg-muted px-4 py-3.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface text-ink-soft">
                <Icon name={PRIVACY_META[c.privacyMode].icon} className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[14px] font-semibold text-ink">{PRIVACY_META[c.privacyMode].label}</p>
                <p className="mt-0.5 text-[13px] leading-relaxed text-ink-soft">
                  {c.privacyMode === "anonymous"
                    ? "No identity is stored for this report — there is nothing to reveal, even to responders."
                    : PRIVACY_META[c.privacyMode].body}
                </p>
                {c.reporterContact && (
                  <p className="mt-1.5 text-[13px] text-ink">
                    <span className="meta-label">Authorized contact: </span>
                    {c.reporterContact}
                    <span className="mt-0.5 block text-xs text-ink-soft">
                      Visible to responders only. Never shown on public case pages.
                    </span>
                  </p>
                )}
              </div>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-ink-soft">
              {c.reports.length} report{c.reports.length === 1 ? "" : "s"} linked ·{" "}
              {c.reports.filter((r) => r.role === "corroborating").length} corroborating
            </p>
          </section>

          {/* Case description */}
          <section aria-label="Report summary" className="card px-5 py-5">
            <h2 className="meta-label mb-3">Original report</h2>
            <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-ink">{c.description}</p>
            <div className="mt-4 grid gap-2 border-t border-line pt-4 text-[13px] text-ink-soft sm:grid-cols-2">
              <p>
                <span className="meta-label block">Incident at</span>
                {formatDateTime(c.incidentAt)}
              </p>
              <p>
                <span className="meta-label block">Area</span>
                {c.locationGeneral || "Not shared"}
              </p>
            </div>
          </section>

          <EvidenceChain evidence={view.evidence} canSeeRestricted />
          <CaseTimeline view={view} showRestricted />

          {/* Internal notes */}
          <section aria-label="Internal notes" className="card px-5 py-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="meta-label">Internal notes</h2>
              <button
                onClick={() => open(dialogs.add_note)}
                className="press inline-flex min-h-9 items-center gap-1.5 rounded-btn bg-muted px-3 text-[12.5px] font-medium text-ink hover:bg-line"
              >
                <Icon name="plus" className="h-3.5 w-3.5" /> Add note
              </button>
            </div>
            {view.notes.length === 0 ? (
              <p className="text-sm text-ink-soft">No internal notes yet.</p>
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

        {/* Right column — actions */}
        <div className="space-y-5">
          <section aria-label="Case actions" className="card px-5 py-5">
            <h2 className="meta-label mb-4">Actions</h2>
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
                        ? "bg-ink text-white hover:bg-black"
                        : "bg-surface text-ink ring-1 ring-line hover:bg-muted"
                  }`}
                >
                  <Icon name={a.icon} className="h-4 w-4 shrink-0" />
                  <span className="flex-1">{a.label}</span>
                  {a.disabled && <span className="text-[11px] font-normal">done</span>}
                </button>
              ))}
            </div>
            <p className="mt-4 border-t border-line pt-3.5 text-xs leading-relaxed text-ink-soft">
              Every action requires a short record and becomes a permanent timeline event. Auditability
              is the point — if it happened, it's on the record.
            </p>
          </section>

          {/* State reference */}
          <section aria-label="Verification reference" className="card px-5 py-5">
            <h2 className="meta-label mb-3">Verification reference</h2>
            <ul className="space-y-2.5">
              {STATE_ORDER.verification.map((s) => (
                <li key={s} className={`flex gap-2.5 rounded-xl px-3 py-2 ${s === c.verification ? "bg-muted" : ""}`}>
                  <Icon name={VERIFICATION_META[s].icon} className="mt-0.5 h-4 w-4 shrink-0 text-ink-soft" />
                  <div>
                    <p className={`text-[13px] font-semibold ${s === c.verification ? "text-ink" : "text-ink-soft"}`}>
                      {VERIFICATION_META[s].label}
                      {s === c.verification && <span className="ml-1.5 text-[11px] font-normal text-brand-deep">current</span>}
                    </p>
                    <p className="text-[12px] leading-snug text-ink-soft">{VERIFICATION_META[s].description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      {/* Action confirmation dialog */}
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
                  Organization
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
                  New verification state
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
                        {VERIFICATION_META[s].label}
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
                  Public update
                </label>
                <textarea
                  id="action-public"
                  value={publicUpdate}
                  onChange={(e) => setPublicUpdate(e.target.value)}
                  rows={3}
                  maxLength={1000}
                  className="field resize-none"
                  placeholder="Shown to everyone following this case — factual and calm"
                />
                <p className="mt-1.5 text-xs text-ink-soft">
                  {publicUpdate.trim()
                    ? `Preview: “${publicUpdate.trim()}”`
                    : "Optional for most actions — required when publishing an update."}
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
                Cancel
              </button>
              <button
                onClick={confirm}
                disabled={busy}
                className="press inline-flex min-h-11 items-center justify-center gap-2 rounded-btn bg-ink px-5 text-[15px] font-medium text-white hover:bg-black disabled:opacity-60"
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
