"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useLocale } from "@/components/system/LocaleProvider";
import { t } from "@/lib/i18n/i18n";

type Mode = "account" | "demo";

/**
 * Responder sign-in.
 *
 * Two explicitly separate paths. The work-account path is the real one; the
 * demo code is labelled as a demo and the server refuses it outside demo mode,
 * so an evaluation build and a production deployment cannot be confused.
 */
export function ResponderAccessClient() {
  const router = useRouter();
  const { locale } = useLocale();
  const [mode, setMode] = useState<Mode>("account");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
        body: JSON.stringify(
          mode === "account" ? { email: email.trim(), password } : { code: code.trim() }
        )
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || t("responder.access.failed", locale));
        return;
      }
      router.push("/responder");
      router.refresh();
    } catch {
      setError(t("responder.access.failed", locale));
    } finally {
      setBusy(false);
    }
  }

  const canSubmit =
    mode === "account" ? email.trim().length > 3 && password.length > 0 : code.trim().length > 0;

  return (
    <main className="mx-auto flex min-h-[calc(100dvh-3.5rem)] max-w-md flex-col justify-center px-4 py-10">
      <div className="card px-6 py-8">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand-deep">
          <Icon name="shield-check" className="h-5 w-5" />
        </span>
        <h1 className="mt-4 text-[22px] font-bold tracking-[-0.02em] text-ink">
          {t("responder.access.title", locale)}
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">
          {t("responder.access.desc", locale)}
        </p>

        {/* A pressed-button group rather than an ARIA tablist: there is no
            tabpanel here, just two variants of the same form, and claiming the
            tab pattern would mislead a screen-reader user about the structure. */}
        <div
          role="group"
          aria-label={t("responder.access.method", locale) || "Sign-in method"}
          className="mt-5 flex gap-1.5 rounded-btn bg-muted p-1"
        >
          {(["account", "demo"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => {
                setMode(m);
                setError(null);
              }}
              className={`press min-h-9 flex-1 rounded-[0.6rem] px-3 text-[13px] font-medium ${
                mode === m ? "bg-surface text-ink shadow-sm" : "text-ink-soft hover:text-ink"
              }`}
            >
              {m === "account"
                ? t("responder.access.tab_account", locale) || "Work account"
                : t("responder.access.tab_demo", locale) || "Demo access"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="mt-5">
          {mode === "account" ? (
            <>
              <label htmlFor="responder-email" className="meta-label mb-1.5 block">
                {t("responder.access.email_label", locale) || "Work email"}
              </label>
              <input
                id="responder-email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                className="field"
                placeholder="you@organization.example"
              />
              <label htmlFor="responder-password" className="meta-label mb-1.5 mt-4 block">
                {t("responder.access.password_label", locale) || "Password"}
              </label>
              <input
                id="responder-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                className="field"
              />
            </>
          ) : (
            <>
              <label htmlFor="access-code" className="meta-label mb-1.5 block">
                {t("responder.access.code_label", locale)}
              </label>
              <input
                id="access-code"
                type="password"
                autoComplete="off"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setError(null);
                }}
                className="field"
                placeholder={t("responder.access.code_placeholder", locale)}
              />
            </>
          )}

          {error && (
            <p role="alert" className="mt-3 text-[13px] text-danger">
              {error}
            </p>
          )}

          <div className="mt-5">
            <Button type="submit" size="lg" className="w-full" disabled={busy || !canSubmit}>
              {busy ? t("responder.dialog.signing_in", locale) : t("responder.dialog.enter_workspace", locale)}
            </Button>
          </div>
        </form>

        <div className="mt-6 rounded-2xl bg-muted px-4 py-3.5 text-[12.5px] leading-relaxed text-ink-soft">
          <p>
            <strong className="font-semibold text-ink">
              {t("responder.access.demo_eval", locale)}
            </strong>{" "}
            {t("responder.access.demo_code_msg", locale)}{" "}
            <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-[12px] text-ink">civora-demo</code>.
          </p>
          <p className="mt-1.5">{t("responder.access.demo_scope_msg", locale)}</p>
          <p className="mt-1.5">{t("responder.access.demo_prod_msg", locale)}</p>
        </div>
      </div>
    </main>
  );
}
