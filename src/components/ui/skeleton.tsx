import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("bs-skeleton rounded-lg", className)} />;
}
