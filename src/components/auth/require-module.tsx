"use client";

import { Lock } from "lucide-react";
import Link from "next/link";
import { useHydrated } from "@/hooks/use-hydrated";
import { usePermissions } from "@/hooks/use-permissions";
import { canAccess, type ModuleKey } from "@/lib/permissions";
import { useStore } from "@/lib/store";
import { MODULES } from "@/components/layout/nav";
import { Skeleton } from "@/components/ui/skeleton";

function PageSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-9 w-56" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <Skeleton className="h-72 w-full" />
    </div>
  );
}

export function RequireModule({
  module,
  children,
}: {
  module: ModuleKey;
  children: React.ReactNode;
}) {
  const hydrated = useHydrated();
  const { role, roleMeta } = usePermissions();
  const access = useStore((s) => s.access);

  if (!hydrated) return <PageSkeleton />;
  if (canAccess(role, access, module)) return <>{children}</>;

  const allowed = MODULES.filter((m) => (access[role] ?? []).includes(m.key));

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <Lock className="size-7" />
      </div>
      <h1 className="text-xl font-bold text-slate-900">Sin acceso</h1>
      <p className="mt-1.5 max-w-sm text-sm text-slate-500">
        Tu perfil de <span className="font-medium">{roleMeta.label}</span> no
        tiene permisos para abrir este módulo. Solicita acceso a un
        administrador.
      </p>
      {allowed.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {allowed.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              <m.icon className="size-4" />
              {m.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
