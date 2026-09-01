"use client";

import { useEffect, useState } from "react";
import { IconArrowUp } from "./icons";

/** Floating scroll-to-top button; appears after scrolling, sits above the
 *  mobile tab bar. */
export default function ScrollTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 700);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!show) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Volver arriba"
      className="fixed right-4 z-40 grid h-11 w-11 place-items-center rounded-full bg-ink text-white shadow-pop transition hover:bg-ink active:scale-90 bottom-[calc(5.25rem+env(safe-area-inset-bottom))]"
    >
      <IconArrowUp className="h-5 w-5" />
    </button>
  );
}
