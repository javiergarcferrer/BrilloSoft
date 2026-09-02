"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

/**
 * One shared IntersectionObserver for every <Reveal> on the page. Marking an
 * element with `data-in` hands the animation off to CSS (see globals.css), so
 * revealing never triggers a React re-render.
 */
let observer: IntersectionObserver | null = null;

function watch(el: Element) {
  observer ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.setAttribute("data-in", "");
          observer?.unobserve(entry.target);
        }
      }
    },
    { rootMargin: "0px 0px -80px 0px" },
  );
  observer.observe(el);
  return () => observer?.unobserve(el);
}

/**
 * Reveals its children with a soft fade-up the first time they scroll into
 * view, using CSS animations driven by a single IntersectionObserver (no
 * animation library in the client bundle).
 *
 * - `eager`: for above-the-fold content. The element is rendered already
 *   "in", so the entrance plays from first paint without waiting for
 *   hydration — the hero copy is never blank while JS loads.
 * - Progressive enhancement: without scripting, or with reduced motion,
 *   everything is simply visible (handled in globals.css).
 */
export function Reveal({
  children,
  delay = 0,
  className,
  eager = false,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  eager?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || eager || el.hasAttribute("data-in")) return;
    if (!("IntersectionObserver" in window)) {
      el.setAttribute("data-in", "");
      return;
    }
    return watch(el);
  }, [eager]);

  const style = delay
    ? ({ "--reveal-delay": `${delay}s` } as CSSProperties)
    : undefined;

  return (
    <div
      ref={ref}
      data-reveal=""
      data-in={eager ? "" : undefined}
      className={className}
      style={style}
    >
      {children}
    </div>
  );
}
