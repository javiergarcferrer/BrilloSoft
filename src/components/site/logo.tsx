/* eslint-disable @next/next/no-img-element */
import { assets, site } from "@/lib/site";
import { cn } from "@/lib/utils";

/** The real Vista Verde wordmark (migrated from Webflow). */
export function BrandLogo({ className }: { className?: string }) {
  return (
    <a
      href="#top"
      className={cn("inline-flex items-center", className)}
      aria-label={`${site.name} — inicio`}
    >
      <img
        src={assets.logo}
        alt={site.name}
        className="h-9 w-auto sm:h-10"
        width={760}
        height={211}
      />
    </a>
  );
}

/** Small decorative leaf glyph. */
export function Leafmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm",
        className,
      )}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="size-[58%]" fill="none">
        <path
          d="M5 19C5 11.6 10.6 7 18.4 7c.3 7.4-5.3 12-13.4 12Z"
          fill="currentColor"
        />
        <path
          d="M6.6 17.8C9.3 14.5 12.7 11.8 16.2 10"
          stroke="#1a5a3a"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

/** Text wordmark for dark surfaces (footer), where the green PNG logo
 *  wouldn't contrast. */
export function Logo({
  className,
  tone = "dark",
}: {
  className?: string;
  tone?: "dark" | "light";
}) {
  return (
    <a
      href="#top"
      className={cn("group inline-flex items-center gap-2.5", className)}
      aria-label={`${site.name} — inicio`}
    >
      <Leafmark className="size-9 transition-transform duration-300 group-hover:-rotate-6" />
      <span className="leading-none">
        <span
          className={cn(
            "block font-display text-[19px] font-semibold tracking-tight",
            tone === "light" ? "text-white" : "text-ink",
          )}
        >
          Vista{" "}
          <span
            className={cn(
              "italic",
              tone === "light" ? "text-brand-300" : "text-brand-600",
            )}
          >
            Verde
          </span>
        </span>
        <span
          className={cn(
            "mt-1 block text-[10px] font-medium uppercase tracking-[0.2em]",
            tone === "light" ? "text-white/55" : "text-ink-soft/70",
          )}
        >
          Limpieza &amp; cuidado
        </span>
      </span>
    </a>
  );
}
