import { cn } from "@/lib/utils";
import type { CaseView } from "@/lib/case-view";
import { Icon } from "@/components/ui/Icon";

// CASE PROGRESS — the shared journey every civic case walks. Rendered from
// the recorded event log, so a step is only "done" when the record shows it.

export function CaseProgress({ view, className }: { view: CaseView; className?: string }) {
  return (
    <section aria-label="Case progress" className={cn("card px-5 py-5", className)}>
      <h2 className="meta-label mb-4">Case progress</h2>
      <ol className="flex items-start gap-1.5">
        {view.progress.map((step, i) => (
          <li key={step.key} className="relative flex min-w-0 flex-1 flex-col items-center gap-2 text-center">
            {i > 0 && (
              <span
                aria-hidden="true"
                className={cn(
                  "absolute right-1/2 top-[13px] -z-0 h-0.5 w-full",
                  step.done ? "bg-success" : "bg-line"
                )}
              />
            )}
            <span
              aria-hidden="true"
              className={cn(
                "relative z-10 flex h-[26px] w-[26px] items-center justify-center rounded-full border-2 text-white",
                step.done
                  ? "border-success bg-success"
                  : step.current
                    ? "border-brand bg-brand"
                    : "border-line bg-muted"
              )}
            >
              {step.done ? (
                <Icon name="check" className="h-3.5 w-3.5" strokeWidth={2.6} />
              ) : step.current ? (
                <Icon name="loader-circle" className="h-3 w-3 animate-[spin_3s_linear_infinite]" strokeWidth={2.6} />
              ) : (
                <span className="h-1.5 w-1.5 rounded-full bg-ink-soft/50" />
              )}
            </span>
            <span
              className={cn(
                "text-[11px] font-medium leading-tight",
                step.done || step.current ? "text-ink" : "text-ink-soft"
              )}
            >
              {step.label}
            </span>
          </li>
        ))}
      </ol>
      <p className="sr-only">
        {view.progress.filter((s) => s.done).map((s) => s.label).join(", ")} completed.
        {view.progress.find((s) => !s.done) &&
          ` Currently at: ${view.progress.find((s) => !s.done)!.label}.`}
      </p>
    </section>
  );
}
