"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";

/**
 * True once the persisted store has been read from localStorage on the client.
 * Gating data-driven UI on this guarantees the server and first client render
 * match (both render the loading shell), avoiding hydration mismatches.
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const unsub = useStore.persist.onFinishHydration(() => setHydrated(true));
    if (useStore.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);

  return hydrated;
}
