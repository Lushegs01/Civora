"use client";

import { useEffect, useState } from "react";
import { formatDateTime, relativeTime } from "@/lib/utils";
import { useLocale } from "@/components/system/LocaleProvider";

// Renders a stable absolute date on the server, then upgrades to a relative
// label after mount — no hydration mismatch, no layout shift.
export function RelativeTime({
  iso,
  prefix,
  className,
  title
}: {
  iso: string;
  prefix?: string;
  className?: string;
  title?: boolean;
}) {
  const { locale } = useLocale();
  const [label, setLabel] = useState<string | null>(null);
  useEffect(() => {
    const update = () => setLabel(relativeTime(iso, Date.now(), locale));
    update();
    const t = setInterval(update, 30_000);
    return () => clearInterval(t);
  }, [iso, locale]);

  const abs = formatDateTime(iso, locale);

  return (
    <time dateTime={iso} className={className} suppressHydrationWarning title={title ? abs : undefined}>
      {label === null ? abs : prefix ? `${prefix} ${label}` : label}
    </time>
  );
}
