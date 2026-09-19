"use client";

import Link from "next/link";
import { CivoraLogo } from "@/components/CivoraLogo";
import { Button } from "@/components/ui/Button";
import { useLocale } from "@/components/system/LocaleProvider";
import { t } from "@/lib/i18n/i18n";

export default function NotFound() {
  const { locale } = useLocale();
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-12 text-center">
      <CivoraLogo size={40} />
      <h1 className="mt-6 text-[24px] font-bold tracking-[-0.02em] text-ink">
        {t("notfound.title", locale)}
      </h1>
      <p className="mt-2.5 max-w-sm text-[14.5px] leading-relaxed text-ink-soft">
        {t("notfound.desc", locale)}
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-2.5">
        <Button href="/home">{t("notfound.back", locale)}</Button>
        <Button href="/community" variant="secondary">
          {t("notfound.browse", locale)}
        </Button>
      </div>
    </main>
  );
}
