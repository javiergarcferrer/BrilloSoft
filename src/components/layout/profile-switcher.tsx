"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";
import { usePermissions } from "@/hooks/use-permissions";
import { teamColor } from "@/lib/colors";
import { ROLE_META, ROLES } from "@/lib/permissions";
import { useStore } from "@/lib/store";
import type { User } from "@/lib/types";
import { cn, initials } from "@/lib/utils";
import { Modal } from "@/components/ui/modal";
import { toastInfo } from "@/components/ui/toast";

function UserAvatar({ user, size = 36 }: { user: User; size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{
        backgroundColor: teamColor(user.colorKey).hex,
        width: size,
        height: size,
        fontSize: size * 0.36,
      }}
    >
      {initials(user.name)}
    </span>
  );
}

export function ProfileSwitcher() {
  const users = useStore((s) => s.users);
  const setCurrentUser = useStore((s) => s.setCurrentUser);
  const { user, roleMeta } = usePermissions();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-2.5 rounded-xl border border-slate-200 p-2 text-left transition-colors hover:bg-slate-50"
      >
        <UserAvatar user={user} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">
            {user.name}
          </p>
          <p className="truncate text-xs text-slate-500">{roleMeta.label}</p>
        </div>
        <ChevronsUpDown className="size-4 shrink-0 text-slate-400" />
      </button>

      <Modal open={open} onClose={() => setOpen(false)}>
        <h2 className="text-lg font-semibold text-slate-900">
          Cambiar de perfil
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Vista previa de roles — elige con qué perfil explorar la plataforma.
        </p>
        <div className="mt-4 max-h-[60vh] space-y-1 overflow-y-auto">
          {ROLES.map((role) => {
            const roleUsers = users.filter((u) => u.role === role);
            if (roleUsers.length === 0) return null;
            return (
              <div key={role}>
                <p className="px-1 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  {ROLE_META[role].label}
                </p>
                {roleUsers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      setCurrentUser(u.id);
                      toastInfo("Perfil activo", `${u.name} · ${ROLE_META[u.role].label}`);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-slate-50",
                      u.id === user.id && "bg-brand-50",
                    )}
                  >
                    <UserAvatar user={u} size={34} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {u.name}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {u.email}
                      </p>
                    </div>
                    {u.id === user.id && (
                      <Check className="size-4 shrink-0 text-brand-600" />
                    )}
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </Modal>
    </>
  );
}
