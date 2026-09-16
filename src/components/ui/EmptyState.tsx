import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

export function EmptyState({
  icon = "folder",
  title,
  body,
  actionLabel,
  actionHref,
  secondaryLabel,
  secondaryHref,
  className
}: {
  icon?: string;
  title: string;
  body: string;
  actionLabel?: string;
  actionHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  className?: string;
}) {
  return (
    <div className={cn("card flex flex-col items-center px-6 py-12 text-center", className)}>
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-ink-soft">
        <Icon name={icon} className="h-5 w-5" />
      </span>
      <h3 className="text-[17px] font-semibold text-ink">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-ink-soft">{body}</p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
        {actionLabel && actionHref && (
          <Button href={actionHref} icon="plus">
            {actionLabel}
          </Button>
        )}
        {secondaryLabel && secondaryHref && (
          <Button href={secondaryHref} variant="secondary">
            {secondaryLabel}
          </Button>
        )}
      </div>
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  body,
  onRetry,
  retryLabel = "Try again"
}: {
  title?: string;
  body: string;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <div className="card flex flex-col items-center px-6 py-10 text-center">
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-danger-soft text-danger">
        <Icon name="circle-alert" className="h-5 w-5" />
      </span>
      <h3 className="text-[17px] font-semibold text-ink">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-ink-soft">{body}</p>
      {onRetry && (
        <div className="mt-5">
          <Button variant="secondary" icon="refresh" onClick={onRetry}>
            {retryLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
