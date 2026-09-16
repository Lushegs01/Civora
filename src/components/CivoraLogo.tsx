import { cn } from "@/lib/utils";

// Original Civora mark: an open loop (the reporting→response cycle) receiving
// a signal dot (the report). No shields, seals or government emblems.
export function CivoraLogo({
  size = 36,
  withWordmark = true,
  className,
  wordmarkClassName
}: {
  size?: number;
  withWordmark?: boolean;
  className?: string;
  wordmarkClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        role="img"
        aria-label="Civora"
        className="shrink-0"
      >
        <rect width="32" height="32" rx="9" fill="#111111" />
        <path
          d="M22.5 9.5a9 9 0 1 0 0 13"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        <circle cx="23.5" cy="16" r="2.6" fill="#2F6BFF" />
      </svg>
      {withWordmark && (
        <span
          className={cn(
            "font-sans text-[19px] font-semibold tracking-[-0.01em] text-ink",
            wordmarkClassName
          )}
        >
          Civora
        </span>
      )}
    </span>
  );
}
