"use client";

import { useLocale } from "@/components/system/LocaleProvider";
import { t } from "@/lib/i18n/i18n";
import { TopBar } from "@/components/shell/TopBar";
import { PRIVACY_META } from "@/lib/types";
import type { PrivacyMode } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";

export function PrivacyClient() {
  const { locale } = useLocale();
  const PRINCIPLES = [
    {
      icon: "eye-off",
      title: t("privacy.principle.1.title", locale),
      body: t("privacy.principle.1.body", locale)
    },
    {
      icon: "lock",
      title: t("privacy.principle.2.title", locale),
      body: t("privacy.principle.2.body", locale)
    },
    {
      icon: "key-round",
      title: t("privacy.principle.3.title", locale),
      body: t("privacy.principle.3.body", locale)
    },
    {
      icon: "shield-check",
      title: t("privacy.principle.4.title", locale),
      body: t("privacy.principle.4.body", locale)
    }
  ];

  return (
    <>
      <TopBar />
      <main className="mx-auto max-w-content px-4 pb-16 pt-5 md:px-8 md:pt-10">
        <h1 className="text-[26px] font-bold tracking-[-0.02em] text-ink md:text-[30px]">
          {t("privacy.title", locale)}
        </h1>
        <p className="mt-2 max-w-xl text-[14.5px] leading-relaxed text-ink-soft">
          {t("privacy.subtitle", locale)}
        </p>

        <section aria-label="Privacy modes" className="mt-8 space-y-3">
          <h2 className="text-[18px] font-semibold tracking-[-0.01em] text-ink">
            {t("privacy.modes.title", locale)}
          </h2>
          {(Object.keys(PRIVACY_META) as PrivacyMode[]).map((key) => {
            const m = PRIVACY_META[key];
            return (
              <div key={key} className="card flex items-start gap-4 px-5 py-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-ink-soft">
                  <Icon name={m.icon} className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-[15px] font-semibold text-ink">{m.label}</h3>
                  <p className="mt-0.5 text-[13.5px] font-medium text-ink">{m.title}</p>
                  <p className="mt-1 text-[13.5px] leading-relaxed text-ink-soft">{m.body}</p>
                  <p className="mt-2 chip bg-muted text-ink-soft">{m.publicLine}</p>
                </div>
              </div>
            );
          })}
        </section>

        <section aria-label="Principles" className="mt-10">
          <h2 className="text-[18px] font-semibold tracking-[-0.01em] text-ink">
            {t("privacy.principles.title", locale)}
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {PRINCIPLES.map((p) => (
              <div key={p.title} className="card px-5 py-5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-soft text-brand-deep">
                  <Icon name={p.icon} className="h-4 w-4" />
                </span>
                <h3 className="mt-3 text-[15px] font-semibold leading-snug text-ink">{p.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">{p.body}</p>
              </div>
            ))}
          </div>
        </section>

        <p className="mt-8 rounded-card bg-muted px-5 py-4 text-[13px] leading-relaxed text-ink-soft">
          {t("privacy.demo_note", locale)}
        </p>
      </main>
    </>
  );
}
