const fs = require('fs');
const path = require('path');

const files = {
  "c:\\Users\\LUSHEGS\\Desktop\\Civora\\src\\components\\responder\\LogoutButton.tsx": `
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { useLocale } from "@/components/system/LocaleProvider";
import { t } from "@/lib/i18n/i18n";

export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const { locale } = useLocale();
  return (
    <button
      onClick={async () => {
        setBusy(true);
        await fetch("/api/responder/session", { method: "DELETE" });
        router.push("/responder/access");
        router.refresh();
      }}
      disabled={busy}
      className="press inline-flex min-h-9 items-center gap-1.5 rounded-btn border border-line bg-surface px-3 text-[13px] font-medium text-ink-soft hover:bg-muted hover:text-ink"
    >
      <Icon name="logout" className="h-4 w-4" />
      {t("responder.logout", locale) || "Sign out"}
    </button>
  );
}`,
  
  "c:\\Users\\LUSHEGS\\Desktop\\Civora\\src\\app\\responder\\access\\page.tsx": `
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useLocale } from "@/components/system/LocaleProvider";
import { t } from "@/lib/i18n/i18n";

export default function ResponderAccessPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { locale } = useLocale();

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
        setError(data?.error || t("responder.access.failed", locale));
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
          {t("responder.access.title", locale)}
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">
          {t("responder.access.desc", locale)}
        </p>

        <form onSubmit={submit} className="mt-6">
          <label htmlFor="access-code" className="meta-label mb-1.5 block">
            {t("responder.access.code_label", locale)}
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
            placeholder={t("responder.access.code_placeholder", locale)}
            autoFocus
          />
          {error && (
            <p role="alert" className="mt-2 text-[13px] text-danger">
              {error}
            </p>
          )}
          <div className="mt-5">
            <Button type="submit" size="lg" className="w-full" disabled={busy || !code.trim()}>
              {busy ? t("responder.dialog.signing_in", locale) : t("responder.dialog.enter_workspace", locale)}
            </Button>
          </div>
        </form>

        <div className="mt-6 rounded-2xl bg-muted px-4 py-3.5 text-[12.5px] leading-relaxed text-ink-soft">
          <p>
            <strong className="font-semibold text-ink">{t("responder.access.demo_eval", locale)}</strong> {t("responder.access.demo_code_msg", locale)} <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-[12px] text-ink">civora-demo</code>.
          </p>
          <p className="mt-1.5">
            {t("responder.access.demo_prod_msg", locale)}
          </p>
        </div>
      </div>
    </main>
  );
}`,
  
  "c:\\Users\\LUSHEGS\\Desktop\\Civora\\src\\components\\shell\\LanguageSwitcher.tsx": `
"use client";

import { useLocale } from "@/components/system/LocaleProvider";
import { Icon } from "@/components/ui/Icon";
import type { Locale } from "@/lib/i18n/i18n";
import { t } from "@/lib/i18n/i18n";

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();

  const handleToggle = () => {
    const next: Record<Locale, Locale> = {
      en: "sw",
      sw: "fr",
      fr: "en"
    };
    setLocale(next[locale]);
  };

  return (
    <button
      onClick={handleToggle}
      className="flex items-center gap-3 px-3 py-2 w-full text-left rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
      aria-label={t("lang.switch", locale)}
    >
      <Icon name="globe" className="h-5 w-5 opacity-70" />
      <span className="font-medium text-sm">
        {t(\`lang.\${locale}\`, locale)}
      </span>
    </button>
  );
}`
};

for (const [filepath, content] of Object.entries(files)) {
  fs.writeFileSync(filepath, content.trim() + "\\n");
}

console.log("Updated simple files.");
