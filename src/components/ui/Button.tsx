import Link from "next/link";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "brandSoft";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-ink text-white hover:bg-black shadow-card",
  secondary: "bg-surface text-ink border border-line hover:bg-muted",
  ghost: "text-ink-soft hover:text-ink hover:bg-muted",
  danger: "bg-danger text-white hover:bg-danger/90",
  brandSoft: "bg-brand-soft text-brand-deep hover:bg-brand/15"
};

const SIZES: Record<Size, string> = {
  sm: "min-h-9 px-3.5 text-[13px] gap-1.5",
  md: "min-h-11 px-5 text-[15px] gap-2",
  lg: "min-h-12 px-6 text-base gap-2"
};

interface ButtonProps {
  variant?: Variant;
  size?: Size;
  icon?: string;
  iconRight?: string;
  href?: string;
  external?: boolean;
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
  "aria-label"?: string;
  children?: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  icon,
  iconRight,
  href,
  external,
  className,
  type = "button",
  disabled,
  onClick,
  children,
  ...aria
}: ButtonProps) {
  const classes = cn(
    "press inline-flex items-center justify-center rounded-btn font-medium whitespace-nowrap",
    VARIANTS[variant],
    SIZES[size],
    disabled && "pointer-events-none opacity-50",
    className
  );

  const inner = (
    <>
      {icon && <Icon name={icon} className="h-4 w-4 shrink-0" />}
      {children}
      {iconRight && <Icon name={iconRight} className="h-4 w-4 shrink-0" />}
    </>
  );

  if (href && !disabled) {
    if (external) {
      return (
        <a href={href} className={classes} target="_blank" rel="noopener noreferrer" {...aria}>
          {inner}
        </a>
      );
    }
    return (
      <Link href={href} className={classes} {...aria}>
        {inner}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} disabled={disabled} onClick={onClick} {...aria}>
      {inner}
    </button>
  );
}
