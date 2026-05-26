"use client";

import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useHydrated } from "@/hooks/use-hydrated";
import { usePermissions } from "@/hooks/use-permissions";
import { canAccess } from "@/lib/permissions";
import { useStore } from "@/lib/store";
import { defaultHrefFor, MODULES } from "@/components/layout/nav";

export default function Home() {
  const hydrated = useHydrated();
  const { role } = usePermissions();
  const access = useStore((s) => s.access);
  const router = useRouter();

  useEffect(() => {
    if (!hydrated) return;
    const keys = MODULES.filter((m) => canAccess(role, access, m.key)).map(
      (m) => m.key,
    );
    router.replace(defaultHrefFor(keys));
  }, [hydrated, role, access, router]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 text-slate-400">
      <span className="flex size-12 animate-pulse items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 text-white">
        <Sparkles className="size-6" />
      </span>
      <p className="text-sm">Cargando tu espacio de trabajo…</p>
    </div>
  );
}
