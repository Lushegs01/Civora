export function DemoTag() {
  return (
    <div className="rounded-2xl border border-line bg-muted px-3.5 py-3 text-[12px] leading-relaxed text-ink-soft">
      <span className="chip mb-1.5 bg-warning-soft text-warning">Demo data</span>
      <p>
        All cases, organizations and people in this build are{" "}
        <strong className="font-semibold text-ink">fictional</strong>, created for evaluation.
      </p>
    </div>
  );
}
