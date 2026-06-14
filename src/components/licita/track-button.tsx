"use client";

import { Bookmark, BookmarkCheck } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTracker } from "@/lib/licitaciones/store";

/**
 * Bookmark toggle that adds/removes a tender from the user's tracking board.
 * Two visual variants: a compact icon button (cards) and a full button (detail).
 */
export function TrackButton({
  id,
  variant = "icon",
  className,
}: {
  id: string;
  variant?: "icon" | "full";
  className?: string;
}) {
  const { isTracked, toggleTrack, hydrated } = useTracker();
  const tracked = hydrated && isTracked(id);

  if (variant === "full") {
    return (
      <button
        type="button"
        onClick={() => toggleTrack(id)}
        aria-pressed={tracked}
        className={cn(
          "inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition-colors",
          tracked
            ? "bg-brand-600 text-white hover:bg-brand-700"
            : "bg-surface text-brand-700 ring-1 ring-inset ring-brand-600/25 hover:bg-brand-50",
          className,
        )}
      >
        {tracked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
        {tracked ? "En seguimiento" : "Dar seguimiento"}
      </button>
    );
  }

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.86 }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleTrack(id);
      }}
      aria-pressed={tracked}
      aria-label={tracked ? "Quitar de seguimiento" : "Dar seguimiento"}
      className={cn(
        "grid h-9 w-9 shrink-0 place-items-center rounded-full ring-1 ring-inset transition-colors",
        tracked
          ? "bg-brand-50 text-brand-600 ring-brand-200"
          : "bg-surface text-ink-soft ring-hairline hover:text-brand-600 hover:ring-brand-200",
        className,
      )}
    >
      {tracked ? <BookmarkCheck className="h-[18px] w-[18px]" /> : <Bookmark className="h-[18px] w-[18px]" />}
    </motion.button>
  );
}
