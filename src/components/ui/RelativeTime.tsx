"use client";

import { useEffect, useState } from "react";
import { relativeTime } from "@/lib/utils";

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
  const [label, setLabel] = useState<string | null>(null);
  useEffect(() => {
    const update = () => setLabel(relativeTime(iso));
    update();
    const t = setInterval(update, 30_000);
    return () => clearInterval(t);
  }, [iso]);

  const abs = new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  });

  return (
    <time dateTime={iso} className={className} suppressHydrationWarning title={title ? abs : undefined}>
      {label === null ? abs : prefix ? `${prefix} ${label}` : label}
    </time>
  );
}
