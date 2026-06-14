"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useInView } from "framer-motion";
import { formatMontoCompacto } from "@/lib/licitaciones/utils";

/**
 * Counts up to `value` when scrolled into view. `format` selects how the running
 * number is rendered — a serializable string so this works as a Client
 * Component prop from a Server Component.
 */
export function StatCounter({
  value,
  format = "int",
  className,
}: {
  value: number;
  format?: "int" | "money";
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, {
      duration: 1.1,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
  }, [inView, value]);

  const text =
    format === "money"
      ? formatMontoCompacto(display)
      : Math.round(display).toLocaleString("es-DO");

  return (
    <span ref={ref} className={className}>
      {text}
    </span>
  );
}
