export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

export function relativeTime(iso: string, now: number = Date.now()): string {
  const diff = now - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const hrs = Math.round(min / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  const weeks = Math.round(days / 7);
  if (weeks < 5) return `${weeks} wk ago`;
  return formatDate(iso);
}

export function minutesAgoLabel(iso: string, now: number = Date.now()): string {
  return `Updated ${relativeTime(iso, now)}`;
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trimEnd() + "…";
}

export function normalizeArea(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

export function tokenOverlap(a: string, b: string): number {
  const setA = new Set(normalizeArea(a).split(" ").filter((t) => t.length > 2));
  const setB = new Set(normalizeArea(b).split(" ").filter((t) => t.length > 2));
  if (setA.size === 0 || setB.size === 0) return 0;
  let inter = 0;
  for (const t of setA) if (setB.has(t)) inter += 1;
  return inter / Math.min(setA.size, setB.size);
}

export function similarity(a: string, b: string): number {
  const wa = normalizeArea(a).split(" ");
  const wb = new Set(normalizeArea(b).split(" "));
  if (wa.length === 0 || wb.size === 0) return 0;
  let hits = 0;
  for (const t of wa) if (t.length > 3 && wb.has(t)) hits += 1;
  return hits / Math.max(4, Math.min(wa.length, 12));
}
