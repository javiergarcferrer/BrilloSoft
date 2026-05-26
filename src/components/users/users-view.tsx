"use client";

import { motion } from "framer-motion";
import { Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { useState } from "react";
import { useHydrated } from "@/hooks/use-hydrated";
import { teamColor } from "@/lib/colors";
import { canAccess, ROLE_META, ROLES } from "@/lib/permissions";
import { useStore } from "@/lib/store";
import type { Role, User } from "@/lib/types";
import { cn, initials } from "@/lib/utils";
import { MODULES } from "@/components/layout/nav";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { toastSuccess } from "@/components/ui/toast";
import { UserEditor } from "./user-editor";

function Toggle({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-5 w-9 shrink-0 rounded-full transition-colors",
        checked ? "bg-brand-500" : "bg-slate-200",
        disabled && "opacity-50",
      )}
      aria-pressed={checked}
    >
      <span
        className={cn(
          "absolute top-0.5 size-4 rounded-full bg-white shadow transition-all",
          checked ? "left-[1.125rem]" : "left-0.5",
        )}
      />
    </button>
  );
}

export function UsersView() {
  const hydrated = useHydrated();
  const users = useStore((s) => s.users);
  const access = useStore((s) => s.access);
  const setRoleAccess = useStore((s) => s.setRoleAccess);
  const removeUser = useStore((s) => s.removeUser);

  const [editing, setEditing] = useState<User | "new" | null>(null);
  const [toDelete, setToDelete] = useState<User | null>(null);

  return (
    <div>
      <PageHeader
        title="Usuarios y permisos"
        description="Gestiona quién pertenece a Vista Verde y a qué módulos accede cada rol."
        actions={
          <Button onClick={() => setEditing("new")}>
            <Plus className="size-4" />
            Nuevo usuario
          </Button>
        }
      />

      {!hydrated ? (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 text-sm font-semibold text-slate-900">
              Equipo · {users.length}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {users.map((u, i) => (
                <motion.div
                  key={u.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Card className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className="flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                          style={{ backgroundColor: teamColor(u.colorKey).hex }}
                        >
                          {initials(u.name)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900">
                            {u.name}
                          </p>
                          <p className="truncate text-xs text-slate-400">
                            {u.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setEditing(u)}
                          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                          aria-label="Editar"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          onClick={() => setToDelete(u)}
                          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500"
                          aria-label="Eliminar"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-3">
                      <span
                        className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                        style={{
                          backgroundColor: teamColor(ROLE_META[u.role].colorKey)
                            .hex,
                        }}
                      >
                        {ROLE_META[u.role].label}
                      </span>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </section>

          <section>
            <div className="mb-3 flex items-center gap-2">
              <ShieldCheck className="size-4 text-brand-600" />
              <h2 className="text-sm font-semibold text-slate-900">
                Permisos por rol
              </h2>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {ROLES.map((role) => (
                <Card key={role}>
                  <CardHeader>
                    <div>
                      <CardTitle>{ROLE_META[role].label}</CardTitle>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {ROLE_META[role].description}
                      </p>
                    </div>
                    {role === "admin" && (
                      <Badge className="bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-600/20">
                        Acceso total
                      </Badge>
                    )}
                  </CardHeader>
                  <CardBody className="grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2">
                    {MODULES.map((m) => {
                      const checked = canAccess(role, access, m.key);
                      return (
                        <label
                          key={m.key}
                          className="flex items-center justify-between gap-3"
                        >
                          <span className="flex items-center gap-2 text-sm text-slate-600">
                            <m.icon className="size-4 text-slate-400" />
                            {m.label}
                          </span>
                          <Toggle
                            checked={checked}
                            disabled={role === "admin"}
                            onChange={(v) => setRoleAccess(role, m.key, v)}
                          />
                        </label>
                      );
                    })}
                  </CardBody>
                </Card>
              ))}
            </div>
          </section>
        </div>
      )}

      <UserEditor target={editing} onClose={() => setEditing(null)} />

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) {
            removeUser(toDelete.id);
            toastSuccess("Usuario eliminado", toDelete.name);
          }
        }}
        title={`¿Eliminar a ${toDelete?.name ?? "usuario"}?`}
        description="Perderá el acceso a la plataforma."
        confirmLabel="Eliminar"
        tone="danger"
      />
    </div>
  );
}
