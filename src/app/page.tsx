import Link from "next/link";
import { readDb, findCase } from "@/lib/db/store";
import { buildCaseView } from "@/lib/case-view";
import { LandingNav } from "@/components/landing/LandingNav";
import { CivoraLogo } from "@/components/CivoraLogo";
import { Button } from "@/components/ui/Button";
import { ResponseBadge, VerificationBadge } from "@/components/ui/Badges";
import { Icon } from "@/components/ui/Icon";

export const dynamic = "force-dynamic";

type DemoView = ReturnType<typeof buildCaseView>;

const HERO_TRUST = [
  { icon: "eye-off", label: "Anonymous reporting" },
  { icon: "link", label: "Evidence-linked cases" },
  { icon: "history", label: "Transparent response" }
];

const LIFECYCLE = [
  {
    label: "Report",
    icon: "file-text",
    body: "Share what happened with only the details needed to open a case."
  },
  {
    label: "Protect",
    icon: "lock-keyhole",
    body: "Keep reporter identity separate from public case information."
  },
  {
    label: "Verify",
    icon: "badge-check",
    body: "Connect evidence and corroboration before status changes."
  },
  {
    label: "Coordinate",
    icon: "building",
    body: "Route cases to the responder or organization able to act."
  },
  {
    label: "Respond",
    icon: "mail-check",
    body: "Record acknowledgement, requests, actions, and public updates."
  },
  {
    label: "Account",
    icon: "scale",
    body: "Show what is known, what changed, and what remains unresolved."
  }
];

const TRUST_PRINCIPLES = [
  {
    icon: "eye-off",
    title: "Private by default",
    body: "Reporter identity stays protected while the public record stays useful."
  },
  {
    icon: "link",
    title: "Evidence-linked",
    body: "Claims, photos, documents, and responses stay connected to their source."
  },
  {
    icon: "history",
    title: "Transparent status",
    body: "Reported, verified, assigned, and resolved are separate states."
  },
  {
    icon: "arrow-right",
    title: "Action-oriented",
    body: "Every case carries a next step so reports do not disappear."
  }
];

const CIVIC_NEEDS = [
  {
    title: "Safety & Protection",
    body: "Report anonymously or confidentially, with privacy in your control.",
    icon: "shield-check"
  },
  {
    title: "Stability & Social Cohesion",
    body: "Give communities reliable information and coordinated response when uncertainty spreads.",
    icon: "handshake"
  },
  {
    title: "Transparency & Accountability",
    body: "Track evidence, response, and actions through a clear, traceable record.",
    icon: "scroll-text"
  }
];

const CONDITIONS = [
  {
    title: "Offline-first reporting",
    body: "Save a report locally and submit when connection returns.",
    icon: "cloud-off",
    stat: "Saved draft",
    detail: "Device only"
  },
  {
    title: "Low-bandwidth by design",
    body: "Text and status come first. Heavy media is optional.",
    icon: "wifi-off",
    stat: "Text first",
    detail: "Media optional"
  },
  {
    title: "Privacy-conscious",
    body: "Keep reporter identity separate from public case information.",
    icon: "lock",
    stat: "Identity protected",
    detail: "Public record safe"
  }
];

const AI_ASSISTS = [
  "AI-assisted summary",
  "AI-assisted evidence comparison",
  "AI-assisted document extraction",
  "AI-assisted timeline organization"
];

const AI_LIMITS = [
  "AI never creates evidence.",
  "AI never determines guilt.",
  "AI never replaces responders."
];

export default function LandingPage() {
  const db = readDb();
  const demo = findCase(db, "CS-1042");
  const demoView = demo ? buildCaseView(db, demo, "public") : null;

  return (
    <div className="min-h-dvh overflow-x-hidden bg-canvas text-ink selection:bg-brand/20">
      <LandingNav />

      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-[-18rem] h-[42rem] w-[42rem] -translate-x-1/2 rounded-full bg-brand/[0.12] blur-3xl" />
        <div className="absolute right-[-12rem] top-[24rem] h-[28rem] w-[28rem] rounded-full bg-warning/10 blur-3xl" />
        <div className="landing-subtle-grid absolute inset-0 opacity-[0.18]" />
      </div>

      <main>
        <section
          id="home"
          aria-labelledby="hero-heading"
          className="relative mx-auto grid min-h-[84vh] max-w-[1400px] grid-cols-1 items-center gap-12 px-5 pb-20 pt-28 sm:px-6 md:pt-32 lg:grid-cols-[minmax(0,1.04fr)_minmax(0,0.96fr)] lg:gap-8 lg:px-10 xl:min-h-[88vh]"
        >
          <div className="landing-reveal max-w-[620px]">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/[0.72] px-3 py-1.5 text-[13px] font-medium text-ink-soft shadow-[0_10px_30px_-24px_rgba(17,17,17,0.55)] backdrop-blur-xl">
              <span className="h-2 w-2 rounded-full bg-brand" aria-hidden="true" />
              Civic incident platform
            </span>

            <h1
              id="hero-heading"
              className="mt-7 text-[48px] font-extrabold leading-[0.98] text-ink sm:text-[58px] md:text-[62px] lg:text-[60px] xl:text-[68px] 2xl:text-[82px]"
            >
              <span className="lg:whitespace-nowrap">Report safely.</span>
              <br />
              <span className="text-brand-deep lg:whitespace-nowrap">Verify carefully.</span>
              <br />
              <span className="lg:whitespace-nowrap">Respond together.</span>
            </h1>

            <p className="mt-7 max-w-[580px] text-[17px] leading-[1.65] text-ink-soft md:text-[18px]">
              Civora connects civic reports, evidence, response, and accountability in one
              traceable workflow — so communities know what's happening and what happens next.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button href="/report" size="lg" icon="plus" className="min-h-[50px] px-6">
                Report an issue
              </Button>
              <Button
                href="/community"
                size="lg"
                variant="secondary"
                icon="search"
                className="min-h-[50px] bg-white/80 px-6 backdrop-blur"
              >
                Explore cases
              </Button>
            </div>

            <div className="mt-7 flex flex-col gap-3 text-[13px] font-medium text-ink-soft sm:flex-row sm:flex-wrap">
              {HERO_TRUST.map((item) => (
                <span key={item.label} className="inline-flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full border border-line bg-white">
                    <Icon name={item.icon} className="h-3.5 w-3.5 text-brand-deep" />
                  </span>
                  {item.label}
                </span>
              ))}
            </div>
          </div>

          <HeroProductStory demoView={demoView} />
        </section>

        <LifecycleSection />
        <TrustSection demoView={demoView} />
        <EvidenceSection demoView={demoView} />
        <CivicNeedsSection />
        <ConditionsSection />
        <AccountabilitySection demoView={demoView} />
        <ResponderSection />
        <AiSection />
        <FinalCta />
      </main>

      <Footer />
    </div>
  );
}

function HeroProductStory({ demoView }: { demoView: DemoView | null }) {
  const c = demoView?.case;
  const caseId = c?.id ?? "CS-1042";
  const reports = demoView?.counts.reports ?? 3;
  const photos = demoView?.counts.photos ?? 1;
  const updates = demoView?.counts.updates ?? 1;

  return (
    <div className="landing-reveal landing-delay-1 relative mx-auto w-full max-w-[680px] lg:max-w-none">
      <div aria-hidden="true" className="absolute left-[8%] top-[8%] h-48 w-48 rounded-full bg-brand/[0.12] blur-3xl" />
      <div aria-hidden="true" className="absolute bottom-[8%] right-[4%] h-40 w-40 rounded-full bg-warning/[0.12] blur-3xl" />

      <div className="relative mx-auto w-full max-w-[540px] rounded-[34px] border border-white/80 bg-white/[0.76] p-3 shadow-[0_34px_90px_-54px_rgba(17,17,17,0.55)] backdrop-blur-xl lg:translate-x-5">
        <div className="rounded-[26px] border border-line bg-[#fbfbf8] p-4 shadow-inner sm:p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold text-ink">CIVORA</p>
              <p className="mt-1 text-[13px] text-ink-soft">Good afternoon</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white">
              <Icon name="shield-check" className="h-5 w-5 text-brand-deep" />
            </div>
          </div>

          <div className="mt-8">
            <p className="max-w-[320px] text-[32px] font-bold leading-[1.05] text-ink sm:text-[40px]">
              Know what's happening.
              <br />
              Know what's verified.
              <br />
              Know what's next.
            </p>
            <Link
              href="/report"
              className="press mt-6 inline-flex min-h-11 items-center gap-2 rounded-[14px] bg-ink px-4 text-[14px] font-semibold text-white transition-colors hover:bg-black"
            >
              <Icon name="plus" className="h-4 w-4" />
              Report an issue
            </Link>
          </div>

          <div className="mt-8">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[13px] font-semibold text-ink">Your active cases</p>
                <p className="mt-1 text-[12px] text-ink-soft">Private tracking on this device</p>
              </div>
              <Link href="/cases" className="text-[12px] font-semibold text-brand-deep hover:underline">
                View all
              </Link>
            </div>

            <Link
              href={`/community/${caseId}`}
              className="group mt-3 block rounded-[22px] border border-line bg-white p-4 shadow-card transition-transform duration-300 hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-[12px] font-semibold text-ink-soft">{caseId}</p>
                  <h2 className="mt-1 text-[18px] font-bold leading-tight text-ink">
                    Safety incident
                  </h2>
                </div>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-danger-soft text-danger">
                  <Icon name="shield-alert" className="h-4 w-4" />
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {c && <VerificationBadge state={c.verification} size="sm" className="uppercase" />}
                {c && <ResponseBadge state={c.response} size="sm" className="uppercase" />}
              </div>

              <div className="mt-4 grid grid-cols-3 divide-x divide-line rounded-[18px] border border-line bg-muted/45">
                <ProductMetric value={reports} label={reports === 1 ? "report" : "reports"} />
                <ProductMetric value={photos} label={photos === 1 ? "photo" : "photos"} />
                <ProductMetric value={updates} label={updates === 1 ? "update" : "updates"} />
              </div>
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 md:mt-0 md:block">
        <FloatingCard className="md:absolute md:-left-24 md:-top-14 md:w-[230px] md:-rotate-2">
          <p className="text-[13px] font-bold text-ink">Evidence chain</p>
          <div className="mt-3 space-y-2">
            {["Citizen report", "Photo evidence", "Corroborating report", "Official response"].map(
              (label, index) => (
                <div key={label} className="flex items-center gap-2 text-[12px] text-ink-soft">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-soft text-brand-deep">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1">{label}</span>
                </div>
              )
            )}
          </div>
        </FloatingCard>

        <FloatingCard className="md:absolute md:right-0 md:top-20 md:w-[220px] md:translate-x-3 md:rotate-2">
          <p className="text-[13px] font-bold text-ink">Case progress</p>
          <div className="mt-3 space-y-2.5">
            {[
              ["Reported", true],
              ["Verified", true],
              ["Assigned", true],
              ["Response pending", false]
            ].map(([label, done]) => (
              <div key={label as string} className="flex items-center gap-2 text-[12px] text-ink-soft">
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full ${
                    done ? "bg-success-soft text-success" : "bg-muted text-ink-soft"
                  }`}
                >
                  {done ? (
                    <Icon name="check" className="h-3 w-3" />
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  )}
                </span>
                {label as string}
              </div>
            ))}
          </div>
        </FloatingCard>

        <FloatingCard className="md:absolute md:bottom-10 md:left-8 md:w-[218px] md:-translate-x-8 md:rotate-1">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-brand-soft text-brand-deep">
              <Icon name="eye-off" className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[13px] font-bold text-ink">Private by default</p>
              <p className="mt-1 text-[12px] leading-relaxed text-ink-soft">
                Anonymous
                <br />
                Reporter identity protected
              </p>
            </div>
          </div>
        </FloatingCard>

        <FloatingCard className="md:absolute md:bottom-2 md:right-8 md:w-[232px] md:translate-x-7 md:-rotate-1">
          <p className="text-[13px] font-bold text-ink">Transparent status</p>
          <div className="mt-3 space-y-2 rounded-[16px] bg-muted/60 p-3 text-[12px] font-semibold text-ink-soft">
            <p>Reported {"\u2260"} Verified</p>
            <p>Verified {"\u2260"} Resolved</p>
          </div>
        </FloatingCard>
      </div>
    </div>
  );
}

function ProductMetric({ value, label }: { value: number; label: string }) {
  return (
    <div className="px-3 py-3 text-center">
      <p className="text-[18px] font-bold leading-none text-ink">{value}</p>
      <p className="mt-1 text-[11px] font-medium text-ink-soft">{label}</p>
    </div>
  );
}

function FloatingCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`landing-drift rounded-[22px] border border-white/80 bg-white/[0.88] p-4 shadow-[0_18px_50px_-32px_rgba(17,17,17,0.55)] backdrop-blur-xl ${className || ""}`}
    >
      {children}
    </div>
  );
}

function LifecycleSection() {
  return (
    <section
      id="lifecycle"
      aria-labelledby="lifecycle-heading"
      className="relative border-y border-line/70 bg-white/[0.52] py-20 backdrop-blur-sm md:py-28"
    >
      <div className="mx-auto max-w-[1400px] px-5 sm:px-6 lg:px-10">
        <div className="max-w-[680px]">
          <h2 id="lifecycle-heading" className="text-[38px] font-bold leading-[1.05] text-ink md:text-[56px]">
            From report to resolution.
          </h2>
          <p className="mt-4 text-[17px] leading-[1.65] text-ink-soft">
            Every case follows a clear lifecycle — with evidence, response, and accountability
            visible at every step.
          </p>
        </div>

        <ol className="relative mt-14 rounded-[30px] border border-line bg-white p-5 shadow-card md:p-6 lg:flex lg:items-start lg:justify-between lg:gap-3">
          <div
            aria-hidden="true"
            className="absolute bottom-8 left-10 top-12 w-px bg-line lg:left-12 lg:right-12 lg:top-[62px] lg:h-px lg:w-auto"
          />
          {LIFECYCLE.map((step, index) => (
            <li key={step.label} className="relative z-10 flex gap-4 py-4 lg:w-1/6 lg:flex-col lg:gap-3 lg:py-0">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] border border-line bg-canvas shadow-sm">
                <Icon name={step.icon} className="h-5 w-5 text-brand-deep" />
              </div>
              <div>
                <p className="font-mono text-[12px] font-semibold text-brand-deep">0{index + 1}</p>
                <h3 className="mt-1 text-[16px] font-bold text-ink">{step.label}</h3>
                <p className="mt-2 max-w-[230px] text-[13px] leading-relaxed text-ink-soft">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function TrustSection({ demoView }: { demoView: DemoView | null }) {
  const known = demoView?.case.known.slice(0, 3) ?? [
    "Multiple reports refer to the same location.",
    "Supporting evidence is available.",
    "An official response has been recorded."
  ];
  const uncertain =
    demoView?.case.uncertain.find((item) => item.toLowerCase().includes("resolution")) ??
    demoView?.case.uncertain[0] ??
    "Resolution has not yet been confirmed.";

  return (
    <section id="about" aria-labelledby="trust-heading" className="py-20 md:py-28">
      <div className="mx-auto grid max-w-[1400px] gap-10 px-5 sm:px-6 lg:grid-cols-[0.82fr_1.18fr] lg:gap-14 lg:px-10">
        <div>
          <h2 id="trust-heading" className="text-[40px] font-bold leading-[1.05] text-ink md:text-[60px]">
            Trust is not a badge.
            <br />
            It's a system.
          </h2>
          <p className="mt-5 max-w-[560px] text-[17px] leading-[1.65] text-ink-soft">
            Civora separates privacy, evidence, verification, and response so public status never
            asks people to guess what has been confirmed.
          </p>

          <div className="mt-10 space-y-5">
            {TRUST_PRINCIPLES.map((item) => (
              <div key={item.title} className="flex gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] border border-line bg-white text-brand-deep shadow-sm">
                  <Icon name={item.icon} className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-[17px] font-bold text-ink">{item.title}</h3>
                  <p className="mt-1 max-w-[460px] text-[14px] leading-relaxed text-ink-soft">
                    {item.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div aria-hidden="true" className="absolute -inset-6 rounded-[40px] bg-brand/[0.08] blur-3xl" />
          <article className="relative overflow-hidden rounded-[32px] border border-line bg-ink p-5 text-white shadow-[0_30px_90px_-48px_rgba(17,17,17,0.75)] md:p-8">
            <div className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-mono text-[13px] font-semibold text-white/[0.58]">{demoView?.case.id ?? "CS-1042"}</p>
                <h3 className="mt-2 max-w-[520px] text-[26px] font-bold leading-tight md:text-[34px]">
                  {demoView?.case.title ?? "Dangerous electrical fault near student residences"}
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {demoView?.case && (
                  <>
                    <VerificationBadge state={demoView.case.verification} size="sm" className="uppercase" />
                    <ResponseBadge state={demoView.case.response} size="sm" className="uppercase" />
                  </>
                )}
              </div>
            </div>

            <div className="grid gap-5 pt-7 md:grid-cols-[1fr_0.82fr]">
              <div className="rounded-[24px] border border-white/10 bg-white/[0.06] p-5">
                <p className="text-[12px] font-bold text-white/[0.62]">WHAT WE KNOW</p>
                <div className="mt-5 space-y-4">
                  {known.map((item) => (
                    <CheckLine key={item}>{item}</CheckLine>
                  ))}
                </div>
              </div>
              <div className="rounded-[24px] border border-warning/25 bg-warning/10 p-5">
                <p className="text-[12px] font-bold text-warning-soft">WHAT REMAINS UNCERTAIN</p>
                <div className="mt-5">
                  <AlertLine>{uncertain}</AlertLine>
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

function EvidenceSection({ demoView }: { demoView: DemoView | null }) {
  const c = demoView?.case;
  const photo = demoView?.evidence.find((item) => item.kind === "photo");
  const official = demoView?.evidence.find((item) => item.kind === "official");
  const corroboration = demoView?.events.find((event) => event.type === "CORROBORATION_RECEIVED");
  const response = demoView?.updates[0];

  const chain = [
    {
      title: "Report",
      type: "Citizen report",
      time: formatCaseTime(c?.createdAt),
      relation: "Opened the case; not treated as verified on its own.",
      icon: "file-text"
    },
    {
      title: "Photo",
      type: photo?.sourceType ?? "Photo evidence",
      time: formatCaseTime(photo?.submittedAt),
      relation: photo?.relationship ?? "Supports the reported location and visible condition.",
      icon: "camera"
    },
    {
      title: "Corroborating report",
      type: "Independent report",
      time: formatCaseTime(corroboration?.at),
      relation: corroboration?.detail ?? "Describes the same location from a separate report.",
      icon: "users"
    },
    {
      title: "Official source",
      type: official?.submittedByLabel ?? "Responsible organization",
      time: formatCaseTime(official?.submittedAt),
      relation: official?.relationship ?? "Records official acknowledgement of the case.",
      icon: "building"
    },
    {
      title: "Response",
      type: response?.authorLabel ?? demoView?.orgName ?? "Responder",
      time: formatCaseTime(response?.at),
      relation: response?.body ?? "Public update recorded for the case.",
      icon: "mail-check"
    }
  ];

  return (
    <section aria-labelledby="evidence-heading" className="bg-[#fbfaf6] py-20 md:py-28">
      <div className="mx-auto grid max-w-[1400px] gap-12 px-5 sm:px-6 lg:grid-cols-[0.86fr_1.14fr] lg:items-center lg:px-10">
        <div>
          <h2 id="evidence-heading" className="max-w-[520px] text-[40px] font-bold leading-[1.05] text-ink md:text-[58px]">
            See the evidence behind the case.
          </h2>
          <p className="mt-5 max-w-[560px] text-[17px] leading-[1.65] text-ink-soft">
            The public record shows where each update came from, how it relates to the case, and
            which parts still need confirmation.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <span className="chip bg-brand-soft text-brand-deep">
              <Icon name="link" className="h-3.5 w-3.5" />
              Source-linked
            </span>
            <span className="chip bg-muted text-ink-soft">
              <Icon name="history" className="h-3.5 w-3.5" />
              Timestamped
            </span>
            <span className="chip bg-success-soft text-success">
              <Icon name="shield-check" className="h-3.5 w-3.5" />
              Public-safe
            </span>
          </div>
        </div>

        <ol className="landing-reveal rounded-[32px] border border-line bg-white p-4 shadow-raise sm:p-5">
          {chain.map((node, index) => (
            <li key={node.title} className="group relative grid gap-4 rounded-[24px] p-4 transition-colors hover:bg-muted/60 sm:grid-cols-[48px_1fr]">
              {index < chain.length - 1 && (
                <span aria-hidden="true" className="absolute bottom-[-20px] left-[38px] top-[62px] hidden w-px bg-line sm:block" />
              )}
              <span className="flex h-12 w-12 items-center justify-center rounded-[16px] border border-line bg-canvas text-brand-deep shadow-sm">
                <Icon name={node.icon} className="h-5 w-5" />
              </span>
              <div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-[17px] font-bold text-ink">{node.title}</h3>
                    <p className="mt-1 text-[13px] font-medium text-ink-soft">{node.type}</p>
                  </div>
                  <time className="rounded-full bg-muted px-3 py-1 text-[12px] font-medium text-ink-soft">
                    {node.time}
                  </time>
                </div>
                <p className="mt-3 max-w-[560px] text-[14px] leading-relaxed text-ink-soft">
                  {node.relation}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function CivicNeedsSection() {
  return (
    <section aria-labelledby="needs-heading" className="py-20 md:py-28">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-6 lg:px-10">
        <div className="max-w-[640px]">
          <h2 id="needs-heading" className="text-[40px] font-bold leading-[1.05] text-ink md:text-[58px]">
            One platform.
            <br />
            Three civic needs.
          </h2>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {CIVIC_NEEDS.map((need, index) => (
            <article key={need.title} className="rounded-[30px] border border-line bg-white p-6 shadow-card transition-transform duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-brand-soft text-brand-deep">
                  <Icon name={need.icon} className="h-5 w-5" />
                </span>
                <span className="font-mono text-[12px] font-semibold text-ink-soft">0{index + 1}</span>
              </div>
              <h3 className="mt-8 text-[22px] font-bold leading-tight text-ink">{need.title}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">{need.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ConditionsSection() {
  return (
    <section aria-labelledby="conditions-heading" className="border-y border-line/70 bg-white/[0.56] py-20 md:py-28">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-6 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
          <div>
            <h2 id="conditions-heading" className="text-[40px] font-bold leading-[1.05] text-ink md:text-[58px]">
              Built for the way people actually connect.
            </h2>
          </div>
          <p className="max-w-[620px] text-[17px] leading-[1.65] text-ink-soft lg:justify-self-end">
            Reporting has to work when the signal is weak, time is short, or sharing identity would
            put someone at risk.
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {CONDITIONS.map((item) => (
            <article key={item.title} className="overflow-hidden rounded-[30px] border border-line bg-canvas shadow-card">
              <div className="min-h-[190px] border-b border-line bg-white p-5">
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-brand-soft text-brand-deep">
                    <Icon name={item.icon} className="h-5 w-5" />
                  </span>
                  <span className="rounded-full bg-muted px-3 py-1 text-[12px] font-semibold text-ink-soft">
                    {item.detail}
                  </span>
                </div>
                <div className="mt-9 rounded-[22px] border border-line bg-canvas p-4">
                  <div className="mb-4 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-success" />
                    <span className="h-2 w-2 rounded-full bg-warning" />
                    <span className="h-2 w-2 rounded-full bg-line" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-2.5 w-full rounded-full bg-ink/[0.12]" />
                    <div className="h-2.5 w-4/5 rounded-full bg-ink/10" />
                    <div className="h-2.5 w-2/5 rounded-full bg-brand/20" />
                  </div>
                  <p className="mt-4 text-[12px] font-semibold text-ink">{item.stat}</p>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-[20px] font-bold text-ink">{item.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">{item.body}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function AccountabilitySection({ demoView }: { demoView: DemoView | null }) {
  const c = demoView?.case;

  return (
    <section aria-labelledby="accountability-heading" className="py-20 md:py-28">
      <div className="mx-auto grid max-w-[1400px] gap-12 px-5 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:px-10">
        <div>
          <h2 id="accountability-heading" className="max-w-[650px] text-[40px] font-bold leading-[1.05] text-ink md:text-[58px]">
            When something is reported,
            <br />
            people should be able to see what happened next.
          </h2>
          <p className="mt-5 max-w-[560px] text-[17px] leading-[1.65] text-ink-soft">
            Public case status helps communities understand progress without exposing private
            reporter information or overstating what has been verified.
          </p>
          <div className="mt-8">
            <Button href="/community" size="lg" icon="search">
              Explore cases
            </Button>
          </div>
        </div>

        <article className="rounded-[32px] border border-line bg-white p-5 shadow-raise md:p-7">
          <div className="flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-mono text-[13px] font-semibold text-ink-soft">CASE #{c?.id ?? "CS-1042"}</p>
              <h3 className="mt-2 text-[26px] font-bold leading-tight text-ink">
                Safety incident
              </h3>
            </div>
            {c && <VerificationBadge state={c.verification} className="uppercase" />}
          </div>

          <div className="mt-6 space-y-3">
            <StatusRow label="Reported" done />
            <StatusRow label="Evidence added" done />
            <StatusRow label="Corroborated" done />
            <StatusRow label="Assigned" done />
          </div>

          <div className="mt-6 rounded-[24px] border border-info/20 bg-info-soft p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[13px] font-semibold text-info">Response</p>
                <p className="mt-1 text-[22px] font-bold text-ink">ACKNOWLEDGED</p>
              </div>
              <span className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-white text-info shadow-sm">
                <Icon name="mail-check" className="h-5 w-5" />
              </span>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2 rounded-[24px] border border-line bg-canvas p-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[14px] font-semibold text-ink">Next update</p>
            <time className="font-mono text-[15px] font-semibold text-brand-deep">
              {formatCaseTime(c?.nextUpdateAt)}
            </time>
          </div>
        </article>
      </div>
    </section>
  );
}

function ResponderSection() {
  const responderMetrics = [
    { label: "new", value: 4 },
    { label: "verification", value: 3 },
    { label: "assigned", value: 2 },
    { label: "in progress", value: 3 }
  ];

  return (
    <section aria-labelledby="responder-heading" className="bg-[#f8f7f2] py-20 md:py-24">
      <div className="mx-auto grid max-w-[1180px] gap-10 px-5 sm:px-6 md:grid-cols-[0.9fr_1.1fr] md:items-center lg:px-10">
        <div>
          <h2 id="responder-heading" className="text-[38px] font-bold leading-[1.06] text-ink md:text-[52px]">
            From report to response.
          </h2>
          <p className="mt-4 max-w-[520px] text-[16px] leading-[1.65] text-ink-soft">
            Civora gives responders a focused workspace for triage, follow-up, and recorded action.
          </p>
        </div>

        <article className="rounded-[30px] border border-line bg-white p-5 shadow-raise md:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[13px] font-semibold text-ink-soft">Responder dashboard</p>
              <p className="mt-1 text-[34px] font-bold leading-none text-ink">12 open cases</p>
            </div>
            <Link
              href="/responder/access"
              className="press inline-flex min-h-10 items-center justify-center rounded-[14px] bg-muted px-4 text-[14px] font-semibold text-ink hover:bg-line/70"
            >
              Demo mode
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {responderMetrics.map((item) => (
              <div key={item.label} className="rounded-[20px] border border-line bg-canvas p-4">
                <p className="text-[26px] font-bold leading-none text-ink">{item.value}</p>
                <p className="mt-2 text-[12px] font-medium text-ink-soft">{item.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-[24px] border border-line bg-white p-4 shadow-card">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[12px] font-semibold text-ink-soft">CS-1042</p>
                <h3 className="mt-1 text-[18px] font-bold text-ink">Safety incident</h3>
              </div>
              <span className="chip bg-warning-soft text-warning">
                <Icon name="circle-dot" className="h-3.5 w-3.5" />
                Partially verified
              </span>
            </div>
            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              {["Accept case", "Request information", "Record action"].map((action) => (
                <button
                  key={action}
                  type="button"
                  className="press min-h-10 rounded-[14px] border border-line bg-canvas px-3 text-[13px] font-semibold text-ink transition-colors hover:bg-muted"
                >
                  {action}
                </button>
              ))}
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}

function AiSection() {
  return (
    <section aria-labelledby="ai-heading" className="py-20 md:py-24">
      <div className="mx-auto grid max-w-[1180px] gap-10 px-5 sm:px-6 md:grid-cols-[1fr_1fr] md:items-start lg:px-10">
        <div>
          <h2 id="ai-heading" className="text-[38px] font-bold leading-[1.06] text-ink md:text-[52px]">
            AI helps organize evidence.
            <br />
            People remain accountable for decisions.
          </h2>
          <p className="mt-4 max-w-[560px] text-[16px] leading-[1.65] text-ink-soft">
            Civora uses assistance carefully: to sort, compare, extract, and summarize material
            that people can inspect.
          </p>
        </div>

        <div className="grid gap-4">
          <article className="rounded-[30px] border border-line bg-white p-5 shadow-card">
            <div className="grid gap-3 sm:grid-cols-2">
              {AI_ASSISTS.map((item) => (
                <div key={item} className="rounded-[20px] bg-canvas p-4">
                  <span className="flex h-9 w-9 items-center justify-center rounded-[14px] bg-brand-soft text-brand-deep">
                    <Icon name="sparkles" className="h-4 w-4" />
                  </span>
                  <p className="mt-4 text-[14px] font-semibold text-ink">{item}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[30px] border border-line bg-ink p-5 text-white shadow-card">
            <div className="space-y-3">
              {AI_LIMITS.map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-[18px] bg-white/[0.07] p-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white">
                    <Icon name="shield" className="h-4 w-4" />
                  </span>
                  <p className="text-[14px] font-semibold text-white/[0.86]">{item}</p>
                </div>
              ))}
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section aria-labelledby="final-cta-heading" className="px-5 py-10 sm:px-6 md:py-14 lg:px-10">
      <div className="mx-auto max-w-[1400px] overflow-hidden rounded-[34px] bg-ink px-6 py-14 text-white shadow-[0_34px_100px_-58px_rgba(17,17,17,0.85)] md:px-10 md:py-20">
        <div className="mx-auto flex max-w-[980px] flex-col items-start gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 id="final-cta-heading" className="max-w-[620px] text-[42px] font-bold leading-[1.02] md:text-[64px]">
              Make every civic report
              <br />
              lead somewhere.
            </h2>
            <p className="mt-5 max-w-[560px] text-[17px] leading-[1.65] text-white/70">
              Civora connects safe reporting, evidence, response, and accountability in one
              traceable workflow.
            </p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link
              href="/report"
              className="press inline-flex min-h-12 items-center justify-center gap-2 rounded-[14px] bg-white px-5 text-[15px] font-semibold text-ink transition-transform hover:-translate-y-0.5"
            >
              <Icon name="plus" className="h-4 w-4" />
              Report an issue
            </Link>
            <Link
              href="/community"
              className="press inline-flex min-h-12 items-center justify-center gap-2 rounded-[14px] border border-white/20 px-5 text-[15px] font-semibold text-white transition-colors hover:bg-white/10"
            >
              <Icon name="search" className="h-4 w-4" />
              Explore cases
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-line bg-canvas">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-8 px-5 py-10 sm:px-6 md:flex-row md:items-start md:justify-between lg:px-10">
        <div>
          <CivoraLogo size={30} />
          <p className="mt-4 max-w-[310px] text-[14px] leading-relaxed text-ink-soft">
            Report safely.
            <br />
            Verify carefully.
            <br />
            Respond together.
          </p>
          <p className="mt-5 text-[12px] text-ink-soft">Prototype for demonstration purposes.</p>
        </div>
        <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-6 gap-y-3 text-[14px] font-medium text-ink-soft">
          <Link href="/community" className="hover:text-ink">
            Explore cases
          </Link>
          <Link href="/report" className="hover:text-ink">
            Report an issue
          </Link>
          <Link href="/resources" className="hover:text-ink">
            Resources
          </Link>
          <Link href="/privacy" className="hover:text-ink">
            Privacy
          </Link>
          <a href="mailto:hello@civora-demo.example" className="hover:text-ink">
            Contact
          </a>
        </nav>
      </div>
    </footer>
  );
}

function StatusRow({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[18px] border border-line bg-canvas px-4 py-3">
      <span className="text-[14px] font-semibold text-ink">{label}</span>
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-full ${
          done ? "bg-success-soft text-success" : "bg-muted text-ink-soft"
        }`}
      >
        {done ? <Icon name="check" className="h-4 w-4" /> : <Icon name="clock" className="h-4 w-4" />}
      </span>
    </div>
  );
}

function CheckLine({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex gap-3 text-[15px] leading-relaxed text-white/[0.82]">
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/20 text-success">
        <Icon name="check" className="h-3 w-3" />
      </span>
      {children}
    </p>
  );
}

function AlertLine({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex gap-3 text-[15px] leading-relaxed text-white/[0.84]">
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-warning/20 text-warning-soft">
        <Icon name="triangle-alert" className="h-3 w-3" />
      </span>
      {children}
    </p>
  );
}

function formatCaseTime(value?: string) {
  if (!value) return "Pending";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Pending";

  const day = new Intl.DateTimeFormat("en-GB", { day: "2-digit" }).format(date);
  const month = new Intl.DateTimeFormat("en-GB", { month: "short" }).format(date);
  const time = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(date);

  return `${day} ${month} · ${time}`;
}
