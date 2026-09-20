"use client";

import type { PublicCaseView } from "@/lib/dto/case";
import { formatDateTime } from "@/lib/utils";
import { ResponseBadge } from "@/components/ui/Badges";
import { Icon } from "@/components/ui/Icon";
import { useLocale } from "@/components/system/LocaleProvider";
import { t } from "@/lib/i18n/i18n";

export function EvidenceSummaryRow({ view }: { view: PublicCaseView }) {
  const { locale } = useLocale();
  const { counts } = view;
  const items = [
    { label: `${counts.reports} ${counts.reports === 1 ? t("case.reportSingular", locale) : t("case.reportsPlural", locale)}`, icon: "file-text" },
    ...(counts.photos > 0
      ? [{ label: `${counts.photos} ${counts.photos === 1 ? t("case.photoSingular", locale) : t("case.photosPlural", locale)}`, icon: "camera" }]
      : []),
    ...(counts.updates > 0
      ? [{ label: `${counts.updates} ${counts.updates === 1 ? t("case.updateSingular", locale) : t("case.updatesPlural", locale)}`, icon: "scroll-text" }]
      : [])
  ];
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {items.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-ink-soft">
          <Icon name={i.icon} className="h-3.5 w-3.5" />
          {i.label}
        </span>
      ))}
    </div>
  );
}

export function ResponseSection({
  view,
  latestUpdate,
  trackHref,
  contactEmail
}: {
  view: PublicCaseView;
  latestUpdate?: { at: string; body: string; authorLabel: string };
  trackHref?: string;
  contactEmail?: string;
}) {
  const { locale } = useLocale();
  const closed = view.response === "closed";

  return (
    <section aria-label={t("case.responseTitle", locale)} className="card px-5 py-5">
      <h2 className="meta-label mb-4">{t("case.responseTitle", locale)}</h2>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="meta-label mb-1">{t("case.responsibleOrg", locale)}</p>
          <p className="text-[14px] font-semibold text-ink">
            {view.orgName || t("case.notAssigned", locale)}
          </p>
        </div>
        <div>
          <p className="meta-label mb-1">{t("case.currentStatus", locale)}</p>
          <ResponseBadge state={view.response} />
        </div>
      </div>

      <div className="mt-5 space-y-4 border-t border-line/60 pt-5">
        {latestUpdate ? (
          <div>
            <p className="meta-label mb-2">
              {t("case.latestUpdate", locale)}
            </p>
            <blockquote className="rounded-2xl bg-canvas px-4 py-3.5">
              <p className="text-[13.5px] leading-relaxed text-ink">&ldquo;{latestUpdate.body}&rdquo;</p>
              <footer className="mt-1.5 text-[11.5px] font-medium text-ink-soft/70">
                — {latestUpdate.authorLabel} · {formatDateTime(latestUpdate.at)}
              </footer>
            </blockquote>
          </div>
        ) : (
          <div>
            <p className="meta-label mb-1">{t("case.latestUpdate", locale)}</p>
            <p className="text-[13.5px] text-ink-soft">
              {t("case.noOfficialResponse", locale)}
            </p>
          </div>
        )}

        <div>
          <p className="meta-label mb-1">{t("case.nextExpectedUpdate", locale)}</p>
          <p className="text-[13.5px] text-ink">
            {closed ? (
              t("case.caseClosedOutcome", locale)
            ) : view.awaitingReporter ? (
              t("case.awaitingReporterInfo", locale)
            ) : view.nextUpdateAt ? (
              formatDateTime(view.nextUpdateAt)
            ) : (
              t("case.notScheduled", locale)
            )}
          </p>
        </div>
      </div>

      {(trackHref || contactEmail) && (
        <div className="mt-5 flex flex-wrap gap-2.5 border-t border-line/60 pt-5">
          {trackHref && (
            <a
              href={trackHref}
              className="press inline-flex min-h-10 items-center gap-2 rounded-btn bg-brand-soft px-4 text-[13.5px] font-medium text-brand-deep hover:bg-brand/15"
            >
              <Icon name="eye" className="h-4 w-4" />
              {t("case.trackUpdatesButton", locale)}
            </a>
          )}
          {contactEmail && (
            <a
              href={`mailto:${contactEmail}?subject=${encodeURIComponent("Inquiry about case " + view.id)}`}
              className="press inline-flex min-h-10 items-center gap-2 rounded-btn border border-line bg-surface px-4 text-[13.5px] font-medium text-ink hover:bg-muted"
            >
              <Icon name="message" className="h-4 w-4" />
              {t("case.contactResponseChannel", locale)}
            </a>
          )}
        </div>
      )}
    </section>
  );
}
