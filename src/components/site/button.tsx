import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "light" | "outlineLight";
type Size = "sm" | "md" | "lg";

interface ButtonProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: Variant;
  size?: Size;
  /** Opens in a new tab with safe rel attributes. */
  external?: boolean;
}

const base =
  "group/btn inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary:
    "bg-brand-600 text-white shadow-brand hover:bg-brand-700 hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-brand-600",
  secondary:
    "bg-white text-brand-700 ring-1 ring-brand-200 hover:ring-brand-300 hover:bg-brand-50 hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-brand-600",
  light:
    "bg-white text-brand-700 shadow-card hover:bg-brand-50 hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-white",
  outlineLight:
    "text-white ring-1 ring-white/30 hover:bg-white/10 hover:ring-white/50 focus-visible:outline-white",
};

const sizes: Record<Size, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-5 py-2.5 text-[15px]",
  lg: "px-7 py-3.5 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  external,
  className,
  children,
  ...rest
}: ButtonProps) {
  const externalProps = external
    ? { target: "_blank", rel: "noopener noreferrer" }
    : {};
  return (
    <a
      className={cn(base, variants[variant], sizes[size], className)}
      {...externalProps}
      {...rest}
    >
      {children}
    </a>
  );
}
