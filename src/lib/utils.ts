export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

// Dates carry a locale for the same reason the rest of the interface does: a
// page translated into French that dates itself "25 November 2025 · 1 wk ago"
// has switched language everywhere except the part telling the reader how old
// the information is. Intl covers all three languages; the default stays
// English, so a server-side caller with no reader in front of it is unchanged.

export function formatDateTime(iso: string, locale: string = "en"): string {
  return new Date(iso).toLocaleString(locale, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function formatDate(iso: string, locale: string = "en"): string {
  return new Date(iso).toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

export function relativeTime(iso: string, now: number = Date.now(), locale: string = "en"): string {
  const diff = now - new Date(iso).getTime();
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const min = Math.round(diff / 60000);
  if (min < 1) return rtf.format(0, "second");
  if (min < 60) return rtf.format(-min, "minute");
  const hrs = Math.round(min / 60);
  if (hrs < 24) return rtf.format(-hrs, "hour");
  const days = Math.round(hrs / 24);
  if (days < 7) return rtf.format(-days, "day");
  const weeks = Math.round(days / 7);
  if (weeks < 5) return rtf.format(-weeks, "week");
  // Past a month, the date itself is more use to a reader than "2 months ago".
  return formatDate(iso, locale);
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trimEnd() + "…";
}
