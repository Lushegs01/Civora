"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/shell/TopBar";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { ConfirmDialog } from "@/components/ui/Modal";
import { DemoTag } from "@/components/shell/DemoTag";
import { getTokens } from "@/lib/offline/db";
import { LanguageSwitcher } from "@/components/shell/LanguageSwitcher";
import { useSimpleMode } from "@/components/system/SimpleMode";
import { useLocale } from "@/components/system/LocaleProvider";
import { t } from "@/lib/i18n/i18n";

function SimpleModeToggle() {
  const { isSimpleMode, setSimpleMode } = useSimpleMode();
  return (
    <button
      role="switch"
      aria-checked={isSimpleMode}
      onClick={() => setSimpleMode(!isSimpleMode)}
      className={`press relative h-7 w-12 shrink-0 rounded-full transition-colors ${
        isSimpleMode ? "bg-brand" : "bg-line"
      }`}
    >
      <span
        className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${
          isSimpleMode ? "left-[22px]" : "left-0.5"
        }`}
      />
    </button>
  );
}

export default function MorePage() {
  const { locale } = useLocale();
  const router = useRouter();
  const [reduceMotion, setReduceMotion] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [clearedNotice, setClearedNotice] = useState<string | null>(null);

  async function resetDemo() {
    setResetBusy(true);
    try {
      await fetch("/api/demo/reset", { method: "POST" });
      setResetDone(true);
      setResetOpen(false);
      router.refresh();
    } finally {
      setResetBusy(false);
    }
  }

  async function clearLocal() {
    // wipe device-local tracking (IndexedDB) — drafts/outbox are kept
    const tokens = await getTokens();
    for (const t of tokens) {
      await fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pairs: [{ caseId: t.caseId, token: t.token }] }) }).catch(() => {});
    }
    indexedDB.deleteDatabase("civora");
    localStorage.removeItem("civora_demo_tracking_seeded_v1");
    setClearedNotice(
      t("more.clear_notice", locale)
    );
    router.refresh();
  }

  const links = [
    { href: "/privacy", icon: "eye-off", label: t("more.link.privacy.label", locale), body: t("more.link.privacy.body", locale) },
    { href: "/resources", icon: "shield-check", label: t("more.link.help.label", locale), body: t("more.link.help.body", locale) },
    { href: "/community", icon: "users", label: t("more.link.community.label", locale), body: t("more.link.community.body", locale) },
    { href: "/responder", icon: "building", label: t("more.link.responder.label", locale), body: t("more.link.responder.body", locale) }
  ];

  return (
    <>
      <TopBar />
      <main className="mx-auto max-w-content px-4 pb-16 pt-5 md:px-8 md:pt-10">
        <h1 className="text-[26px] font-bold tracking-[-0.02em] text-ink md:text-[30px]">
          More
        </h1>
        <p className="mt-2 text-[14.5px] text-ink-soft">
          {t("more.subtitle", locale)}
        </p>

        <section aria-label="Civora links" className="mt-6 space-y-2.5">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="press card flex items-center gap-4 px-5 py-4 hover:shadow-raise"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-ink-soft">
                <Icon name={l.icon} className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold text-ink">{l.label}</span>
                <span className="block text-[13px] text-ink-soft">{l.body}</span>
              </span>
              <Icon name="chevron-right" className="h-4 w-4 shrink-0 text-ink-soft/60" />
            </Link>
          ))}
        </section>

        <section aria-label="Settings" className="mt-8">
          <h2 className="text-[18px] font-semibold tracking-[-0.01em] text-ink">{t("more.settings.title", locale)}</h2>
          <div className="card mt-3.5 divide-y divide-line">
            <div className="flex items-center justify-between gap-4 px-5 py-4">
              <div>
                <p className="text-[14.5px] font-semibold text-ink">{t("more.settings.simple.title", locale)}</p>
                <p className="mt-0.5 text-[13px] text-ink-soft">
                  {t("more.settings.simple.desc", locale)}
                </p>
              </div>
              <SimpleModeToggle />
            </div>

            <div className="flex items-center justify-between gap-4 px-5 py-4">
              <div>
                <p className="text-[14.5px] font-semibold text-ink">{t("more.settings.lang.title", locale)}</p>
                <p className="mt-0.5 text-[13px] text-ink-soft">
                  {t("more.settings.lang.desc", locale)}
                </p>
              </div>
              <div className="w-32">
                <LanguageSwitcher />
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 px-5 py-4">
              <div>
                <p className="text-[14.5px] font-semibold text-ink">{t("more.settings.motion.title", locale)}</p>
                <p className="mt-0.5 text-[13px] text-ink-soft">
                  {t("more.settings.motion.desc", locale)}
                </p>
              </div>
              <button
                role="switch"
                aria-checked={reduceMotion}
                onClick={() => {
                  const next = !reduceMotion;
                  setReduceMotion(next);
                  document.documentElement.style.scrollBehavior = next ? "auto" : "";
                }}
                className={`press relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                  reduceMotion ? "bg-brand" : "bg-line"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${
                    reduceMotion ? "left-[22px]" : "left-0.5"
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        <section aria-label="Demo tools" className="mt-8">
          <h2 className="text-[18px] font-semibold tracking-[-0.01em] text-ink">{t("more.demo.title", locale)}</h2>
          <div className="mt-3.5">
            <DemoTag />
          </div>
          {resetDone && (
            <p role="status" className="mt-3 rounded-xl bg-success-soft px-3.5 py-2.5 text-[13px] font-medium text-success">
              {t("more.demo.reset_done", locale)}
            </p>
          )}
          {clearedNotice && (
            <p role="status" className="mt-3 rounded-xl bg-muted px-3.5 py-2.5 text-[13px] text-ink">
              {clearedNotice}
            </p>
          )}
          <div className="mt-3.5 flex flex-wrap gap-2.5">
            <Button variant="secondary" icon="refresh" onClick={() => setResetOpen(true)}>{t("more.demo.reset_btn", locale)}</Button>
            <Button variant="ghost" icon="trash" onClick={clearLocal}>{t("more.demo.clear_btn", locale)}</Button>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-ink-soft">
            {t("more.demo.hint", locale)}
          </p>
        </section>

        <section aria-label="About" className="mt-8">
          <h2 className="text-[18px] font-semibold tracking-[-0.01em] text-ink">{t("more.about.title", locale)}</h2>
          <div className="card mt-3.5 px-5 py-5 text-[13.5px] leading-relaxed text-ink-soft">
            <p>
              {t("more.about.p1", locale)}
            </p>
            <p className="mt-3">
              It separates <strong className="font-semibold text-ink">reported</strong>,{" "}
              <strong className="font-semibold text-ink">verified</strong>,{" "}
              <strong className="font-semibold text-ink">responded</strong> and{" "}
              <strong className="font-semibold text-ink">resolved</strong> — because collapsing them
              is how communities lose trust in information.
            </p>
          </div>
        </section>

        <ConfirmDialog
          open={resetOpen}
          onClose={() => setResetOpen(false)}
          onConfirm={resetDemo}
          busy={resetBusy}
          title={t("more.dialog.title", locale)}
          description={t("more.dialog.desc", locale)}
          confirmLabel={t("more.dialog.confirm", locale)}
        />
      </main>
    </>
  );
}
