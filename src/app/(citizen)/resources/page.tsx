import type { Metadata } from "next";
import { TopBar } from "@/components/shell/TopBar";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = { title: "Get help" };

// Emergency contacts are configurable via EMERGENCY_CONTACTS (see .env.example).
// Civora never hard-codes emergency services and never presents itself as one.
function loadContacts(): Array<{ name: string; detail?: string; phone?: string }> {
  try {
    const raw = process.env.EMERGENCY_CONTACTS;
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const SAFETY_STEPS = [
  {
    title: "Move away from danger first",
    body: "If a situation is actively dangerous, leave the area before doing anything else. Your report can wait; your safety can't."
  },
  {
    title: "Report here when it's safe",
    body: "Civora preserves what happened and routes it to a responsible organization. Reports are not emergency calls."
  },
  {
    title: "You don't have to identify yourself",
    body: "Anonymous reports carry the same case lifecycle — evidence, verification, response and public status."
  }
];

export default function ResourcesPage() {
  const contacts = loadContacts();

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
                Immediate danger?
              </h1>
              <p className="mt-1.5 max-w-xl text-[14px] leading-relaxed text-ink">
                Contact the appropriate emergency or protection service if someone is in immediate
                danger. Civora is a civic reporting platform — it is not an emergency response
                service.
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
                      Call
                    </a>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-5 rounded-2xl bg-surface px-4 py-4 text-[13px] leading-relaxed text-ink-soft">
              <p className="font-semibold text-ink">Emergency contacts are not configured.</p>
              <p className="mt-1">
                This deployment deliberately shows no invented emergency numbers. Administrators can
                configure local services through the <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[12px]">EMERGENCY_CONTACTS</code>{" "}
                environment variable — see <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[12px]">.env.example</code>.
              </p>
            </div>
          )}
        </div>

        <section aria-label="Safe reporting" className="mt-8">
          <h2 className="text-[18px] font-semibold tracking-[-0.01em] text-ink">
            Safe reporting guidance
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
            Referral pathways
          </h2>
          <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-ink-soft">
            Cases in Civora can be routed to configured organizations for appropriate response:
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              ["building", "Facilities Department", "Building and electrical safety concerns"],
              ["wrench", "Public Works Office", "Streets, lighting and public infrastructure"],
              ["scale", "Community Mediation Unit", "Neutral mediation for shared-space disputes"],
              ["shield", "Safety & Protection Desk", "Triage and referral for safety concerns"]
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
            Organizations are fictional in this demo build. Real deployments configure their own
            responders.
          </p>
        </section>
      </main>
    </>
  );
}
