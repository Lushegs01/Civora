"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { CaseView } from "@/lib/case-view";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { fileError, prepareFile } from "@/lib/client/upload";
import { getTokens, getToken, saveToken } from "@/lib/offline/db";

// Role-aware next actions. A case never dead-ends: there is always a concrete
// next step visible (Rule 5).

export function CaseActionBar({
  view,
  tracked: trackedInitial,
  hasToken
}: {
  view: CaseView;
  tracked: boolean;
  hasToken: boolean;
}) {
  const router = useRouter();
  const c = view.case;
  const [message, setMessage] = useState<string | null>(null);
  const [tracked, setTracked] = useState(trackedInitial);
  const [showAddEvidence, setShowAddEvidence] = useState(false);

  const isReporter = hasToken;
  const closed = c.response === "closed";

  async function track() {
    const t = await getToken(c.id);
    if (t) {
      setTracked(true);
      return;
    }
    await saveToken(c.id, `public-track-${c.id.toLowerCase()}`);
    setTracked(true);
    setMessage("You're now tracking this case on this device.");
  }

  async function share() {
    const url = `${window.location.origin}/community/${c.id}`;
    const shareData = {
      title: `Civora case ${c.id}`,
      text: `Public case ${c.id}: ${c.title}`,
      url
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
      throw new Error("no share");
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        setMessage("Public case link copied to your clipboard.");
      } catch {
        setMessage(url);
      }
    }
  }

  async function requestUpdate() {
    const tokens = await getTokens();
    const t = tokens.find((x) => x.caseId === c.id);
    if (!t) {
      setMessage("Open this case through your tracking link to request an update.");
      return;
    }
    const res = await fetch("/api/cases/request-update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caseId: c.id, token: t.token })
    });
    const data = await res.json().catch(() => ({}));
    setMessage(
      res.ok
        ? "Update requested. The responding organization will see your request on the case."
        : data?.error || "The request couldn't be sent. Please try again."
    );
  }

  return (
    <section aria-label="Actions" className="card px-5 py-5">
      <h2 className="meta-label mb-4">What you can do next</h2>
      <div className="flex flex-wrap gap-2.5">
        {isReporter && !closed && (
          <Button icon="paperclip" onClick={() => setShowAddEvidence(true)}>
            Add evidence
          </Button>
        )}
        {!isReporter && !tracked && (
          <Button icon="eye" variant="secondary" onClick={track}>
            Track this case
          </Button>
        )}
        {tracked && !isReporter && (
          <Button icon="check" variant="brandSoft">
            Tracking on this device
          </Button>
        )}
        <Button icon="share" variant="secondary" onClick={share}>
          Share public case
        </Button>
        {isReporter && !closed && (
          <Button icon="clock" variant="secondary" onClick={requestUpdate}>
            Request update
          </Button>
        )}
        {c.category === "safety" && (
          <Button icon="siren" variant="brandSoft" href="/resources">
            Urgent danger? Get help
          </Button>
        )}
        <Button icon="plus" variant="ghost" href="/report">
          Report another issue
        </Button>
      </div>

      {message && (
        <p role="status" className="mt-3.5 rounded-xl bg-muted px-3.5 py-2.5 text-[13px] text-ink">
          {message}
        </p>
      )}

      <AddEvidenceDialog
        caseId={c.id}
        open={showAddEvidence}
        onClose={() => setShowAddEvidence(false)}
        onDone={() => {
          setShowAddEvidence(false);
          setMessage("Evidence added to the case. It's now part of the evidence chain.");
          router.refresh();
        }}
      />
    </section>
  );
}

function AddEvidenceDialog({
  caseId,
  open,
  onClose,
  onDone
}: {
  caseId: string;
  open: boolean;
  onClose: () => void;
  onDone: () => void;
}) {
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const tokens = await getTokens();
      const t = tokens.find((x) => x.caseId === caseId);
      if (!t) throw new Error("This case isn't tracked on this device, so evidence can't be added.");

      const file = fileRef.current?.files?.[0] || null;
      let payloadFile: unknown = undefined;
      if (file) {
        const err = fileError(file);
        if (err) throw new Error(err);
        payloadFile = await prepareFile(file);
      }
      const note = noteRef.current?.value.trim();
      if (!file && !note) throw new Error("Add a short note or attach a file.");

      const res = await fetch("/api/evidence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId, token: t.token, note: note || undefined, file: payloadFile })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "The evidence couldn't be added. Please try again.");
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "The evidence couldn't be added.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add evidence">
      <p className="mb-4 text-sm leading-relaxed text-ink-soft">
        Anything you add becomes part of case {caseId}'s evidence chain, with its source and checksum
        recorded.
      </p>
      <div className="space-y-3.5">
        <div>
          <label htmlFor="evidence-note" className="meta-label mb-1.5 block">
            Short note
          </label>
          <textarea
            id="evidence-note"
            ref={noteRef}
            rows={3}
            maxLength={400}
            className="field resize-none"
            placeholder="What does this evidence show?"
          />
        </div>
        <div>
          <label htmlFor="evidence-file" className="meta-label mb-1.5 block">
            File (optional)
          </label>
          <input
            id="evidence-file"
            ref={fileRef}
            type="file"
            accept="image/*,video/mp4,video/webm,application/pdf,text/plain"
            onChange={(e) => setFileName(e.target.files?.[0]?.name || null)}
            className="block w-full rounded-field border border-line bg-surface px-3.5 py-2.5 text-[13.5px] text-ink-soft file:mr-3 file:rounded-lg file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-[13px] file:font-medium file:text-ink"
          />
          {fileName && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-ink-soft">
              <Icon name="paperclip" className="h-3.5 w-3.5" /> {fileName}
            </p>
          )}
        </div>
        {error && (
          <p role="alert" className="rounded-xl bg-danger-soft px-3.5 py-2.5 text-[13px] text-danger">
            {error}
          </p>
        )}
        <div className="flex flex-col-reverse gap-2.5 pt-1 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy}>
            {busy ? "Adding…" : "Add to case"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
