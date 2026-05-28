import { Leaf } from "lucide-react";
import { cn } from "@/lib/utils";

/** Vista Verde wordmark: a leaf roundel + "Vista Verde". */
export function Logo({
  light = false,
  className,
}: {
  light?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="grid h-8 w-8 place-items-center rounded-xl bg-brand-600 text-white shadow-sm">
        <Leaf className="h-4 w-4" strokeWidth={2.25} />
      </span>
      <span
        className={cn(
          "font-display text-lg font-semibold tracking-tight",
          light ? "text-white" : "text-ink",
        )}
      >
        Vista{" "}
        <span className={light ? "text-brand-200" : "text-brand-600"}>
          Verde
        </span>
      </span>
    </span>
  );
}
