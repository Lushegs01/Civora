import { cn } from "@/lib/utils";
import type { CaseView } from "@/lib/case-view";
import { Icon } from "@/components/ui/Icon";

// Trust panel — the signature transparency feature. What is known and what
// remains uncertain are always shown together (Rule 4: never hide uncertainty).

export function TrustPanel({ view, className }: { view: CaseView; className?: string }) {
  const { known, uncertain } = view.case;
  return (
    <section aria-label="What we know and what remains uncertain" className={cn("space-y-3", className)}>
      <div className="card px-5 py-5">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold text-ink">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-success-soft text-success">
            <Icon name="check" className="h-3.5 w-3.5" strokeWidth={2.6} />
          </span>
          What we know
        </h2>
        {known.length === 0 ? (
          <p className="mt-2.5 text-[13px] leading-relaxed text-ink-soft">
            Nothing has been established yet beyond the initial report.
          </p>
        ) : (
          <ul className="mt-3 space-y-2.5">
            {known.map((k, i) => (
              <li key={i} className="flex gap-2.5 text-[13.5px] leading-relaxed text-ink">
                <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-success" strokeWidth={2.4} />
                <span>{k}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card px-5 py-5">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold text-ink">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-warning-soft text-warning">
            <Icon name="triangle-alert" className="h-3.5 w-3.5" strokeWidth={2.4} />
          </span>
          What remains uncertain
        </h2>
        {uncertain.length === 0 ? (
          <p className="mt-2.5 text-[13px] leading-relaxed text-ink-soft">
            No open uncertainties are recorded for this case.
          </p>
        ) : (
          <ul className="mt-3 space-y-2.5">
            {uncertain.map((u, i) => (
              <li key={i} className="flex gap-2.5 text-[13.5px] leading-relaxed text-ink">
                <Icon name="triangle-alert" className="mt-0.5 h-4 w-4 shrink-0 text-warning" strokeWidth={2.2} />
                <span>{u}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
