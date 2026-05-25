import { cn } from "@/lib/utils";
import type { StatusMeta } from "@/lib/colors";

export function Badge({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({
  meta,
  pulse = false,
  className,
}: {
  meta: StatusMeta;
  pulse?: boolean;
  className?: string;
}) {
  return (
    <Badge className={cn(meta.badge, className)} >
      <span
        className={cn(
          "size-1.5 rounded-full",
          meta.dot,
          pulse && "bs-pulse-dot",
        )}
        style={{ color: meta.hex }}
      />
      {meta.label}
    </Badge>
  );
}
