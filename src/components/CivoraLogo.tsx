import { cn } from "@/lib/utils";

export function CivoraLogo({
  size = 36,
  withWordmark = true,
  className,
  wordmarkClassName,
  dark = false
}: {
  size?: number;
  withWordmark?: boolean;
  className?: string;
  wordmarkClassName?: string;
  dark?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <img
        src="/logo.png"
        alt="Civora"
        width={size}
        height={size}
        className={cn(
          "shrink-0 rounded-md",
          dark ? "mix-blend-screen" : "mix-blend-multiply"
        )}
        style={{
          width: size,
          height: size,
          objectFit: "cover",
          filter: dark ? "invert(1) contrast(1.2)" : undefined
        }}
      />
      {withWordmark && (
        <span
          className={cn(
            "font-sans text-[19px] font-semibold tracking-[-0.01em]",
            dark ? "text-white" : "text-ink",
            wordmarkClassName
          )}
        >
          Civora
        </span>
      )}
    </span>
  );
}
