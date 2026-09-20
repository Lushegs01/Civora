"use client";

import { useLocale } from "@/components/system/LocaleProvider";
import { t } from "@/lib/i18n/i18n";
import { TopBar } from "@/components/shell/TopBar";
import { Icon } from "@/components/ui/Icon";

export function ResourcesClient({ contacts }: { contacts: Array<{ name: string; detail?: string; phone?: string }> }) {
  const { locale } = useLocale();

  const SAFETY_STEPS = [
    {
      title: t("resources.safety.1.title", locale),
      body: t("resources.safety.1.body", locale)
    },
    {
      title: t("resources.safety.2.title", locale),
      body: t("resources.safety.2.body", locale)
    },
    {
      title: t("resources.safety.3.title", locale),
      body: t("resources.safety.3.body", locale)
    }
  ];

  return (
    <>
      <TopBar />
      <main className="mx-auto max-w-content px-4 pb-16 pt-5 md:px-8 md:pt-10">
        <div className="rounded-container border border-danger/25 bg-danger-soft/50 px-5 py-5 md:px-6">
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-danger text-white">
              <Icon name="siren" className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-[19px] font-bold tracking-[-0.01em] text-ink">
                {t("resources.danger.title", locale)}
              </h1>
              <p className="mt-1.5 max-w-xl text-[14px] leading-relaxed text-ink">
                {t("resources.danger.desc", locale)}
              </p>
            </div>
          </div>

          {contacts.length > 0 ? (
            <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
              {contacts.map((c) => (
                <li key={c.name} className="flex items-center gap-3 rounded-2xl bg-surface px-4 py-3.5">
                  <Icon name="phone" className="h-4 w-4 shrink-0 text-ink-soft" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-semibold text-ink">{c.name}</p>
                    {c.detail && <p className="text-xs text-ink-soft">{c.detail}</p>}
                  </div>
                  {c.phone && (
                    <a
                      href={`tel:${c.phone}`}
                      className="press inline-flex min-h-10 shrink-0 items-center rounded-btn bg-danger px-4 text-[13.5px] font-semibold text-white"
                    >
                      {t("resources.danger.call", locale)}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-5 rounded-2xl bg-surface px-4 py-4 text-[13px] leading-relaxed text-ink-soft">
              <p className="font-semibold text-ink">{t("resources.danger.not_configured", locale)}</p>
              <p className="mt-1">
                {t("resources.danger.not_configured_desc_1", locale)} <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[12px]">EMERGENCY_CONTACTS</code>{" "}
                {t("resources.danger.not_configured_desc_2", locale)} <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[12px]">.env.example</code>.
              </p>
            </div>
          )}
        </div>

        <section aria-label="Safe reporting" className="mt-8">
          <h2 className="text-[18px] font-semibold tracking-[-0.01em] text-ink">
            {t("resources.safety.title", locale)}
          </h2>
          <div className="mt-4 space-y-3">
            {SAFETY_STEPS.map((s, i) => (
              <div key={s.title} className="card flex items-start gap-4 px-5 py-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted font-mono text-[12px] font-semibold text-ink">
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-[14.5px] font-semibold text-ink">{s.title}</h3>
                  <p className="mt-1 text-[13.5px] leading-relaxed text-ink-soft">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section aria-label="Referral pathways" className="mt-8">
          <h2 className="text-[18px] font-semibold tracking-[-0.01em] text-ink">
            {t("resources.pathways.title", locale)}
          </h2>
          <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-ink-soft">
            {t("resources.pathways.desc", locale)}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              ["building", t("resources.pathways.1.name", locale), t("resources.pathways.1.desc", locale)],
              ["wrench", t("resources.pathways.2.name", locale), t("resources.pathways.2.desc", locale)],
              ["scale", t("resources.pathways.3.name", locale), t("resources.pathways.3.desc", locale)],
              ["shield", t("resources.pathways.4.name", locale), t("resources.pathways.4.desc", locale)]
            ].map(([icon, name, desc]) => (
              <div key={name} className="card flex items-center gap-3.5 px-5 py-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-ink-soft">
                  <Icon name={icon} className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-[14px] font-semibold text-ink">{name}</h3>
                  <p className="text-xs text-ink-soft">{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-ink-soft">
            {t("resources.pathways.note", locale)}
          </p>
        </section>
      </main>
    </>
  );
}
