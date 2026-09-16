"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

export default function ResponderAccessPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/responder/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "Sign-in failed. Please try again.");
        return;
      }
      router.push("/responder");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-[calc(100dvh-3.5rem)] max-w-md flex-col justify-center px-4 py-10">
      <div className="card px-6 py-8">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand-deep">
          <Icon name="shield-check" className="h-5 w-5" />
        </span>
        <h1 className="mt-4 text-[22px] font-bold tracking-[-0.02em] text-ink">
          Responder workspace
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">
          For institutional responders handling assigned cases. Roles are verified by the server —
          not by the app running in your browser.
        </p>

        <form onSubmit={submit} className="mt-6">
          <label htmlFor="access-code" className="meta-label mb-1.5 block">
            Access code
          </label>
          <input
            id="access-code"
            type="password"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setError(null);
            }}
            autoComplete="off"
            className="field"
            placeholder="Enter the demo access code"
            autoFocus
          />
          {error && (
            <p role="alert" className="mt-2 text-[13px] text-danger">
              {error}
            </p>
          )}
          <div className="mt-5">
            <Button type="submit" size="lg" className="w-full" disabled={busy || !code.trim()}>
              {busy ? "Signing in…" : "Enter workspace"}
            </Button>
          </div>
        </form>

        <div className="mt-6 rounded-2xl bg-muted px-4 py-3.5 text-[12.5px] leading-relaxed text-ink-soft">
          <p>
            <strong className="font-semibold text-ink">Demo evaluation:</strong> the shared demo
            access code is <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-[12px] text-ink">civora-demo</code>.
          </p>
          <p className="mt-1.5">
            In production this is replaced by your organization's identity provider; no case data is
            shown here without a verified session.
          </p>
        </div>
      </div>
    </main>
  );
}
