import { cn } from "@/lib/utils";

/**
 * LicitaRD mark — a stylized ballot/magnifier glyph in the brand gradient.
 * Pure SVG so it renders anywhere (header, footer, OG image).
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={cn("h-9 w-9", className)}
      role="img"
      aria-label="LicitaRD"
    >
      <defs>
        <linearGradient id="lr-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1f4fd8" />
          <stop offset="1" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill="url(#lr-grad)" />
      {/* document lines */}
      <rect x="11" y="12" width="13" height="2.4" rx="1.2" fill="white" opacity="0.95" />
      <rect x="11" y="18" width="9" height="2.4" rx="1.2" fill="white" opacity="0.7" />
      {/* magnifier + check */}
      <circle cx="24" cy="24" r="5.6" fill="none" stroke="white" strokeWidth="2.4" />
      <path d="M27.8 27.8 31.5 31.5" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M21.6 24.1 23.4 25.8 26.4 22.2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

export function BrandWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <BrandMark />
      <span className="text-lg font-semibold tracking-tight text-ink">
        Licita<span className="text-brand-600">RD</span>
      </span>
    </span>
  );
}
