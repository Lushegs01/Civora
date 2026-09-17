import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";

interface EmptyStateProps {
  icon: string;
  title: string;
  body: string;
  actionLabel?: string;
  actionHref?: string;
  actionOnClick?: () => void;
  className?: string;
}

export function EmptyState({ icon, title, body, actionLabel, actionHref, actionOnClick, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-[24px] border border-line border-dashed bg-canvas px-8 py-14 text-center",
        className
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-ink-soft">
        <Icon name={icon} className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-[16px] font-semibold tracking-[-0.01em] text-ink">{title}</h3>
      <p className="mt-2 max-w-sm text-[13.5px] leading-relaxed text-ink-soft">{body}</p>
      {actionLabel && (actionHref || actionOnClick) && (
        <div className="mt-6">
          <Button variant="secondary" href={actionHref} onClick={actionOnClick}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  body = "We had trouble loading this data. Please try again.",
  onRetry,
  className
}: {
  title?: string;
  body?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-[24px] border border-line bg-surface px-8 py-14 text-center",
        className
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-danger/10 text-danger">
        <Icon name="triangle-alert" className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-[16px] font-semibold tracking-[-0.01em] text-ink">{title}</h3>
      <p className="mt-2 max-w-sm text-[13.5px] leading-relaxed text-ink-soft">{body}</p>
      {onRetry && (
        <div className="mt-6">
          <Button variant="secondary" onClick={onRetry}>
            Try again
          </Button>
        </div>
      )}
    </div>
  );
}
