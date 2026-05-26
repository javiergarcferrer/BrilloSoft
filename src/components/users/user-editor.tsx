"use client";

import { useState } from "react";
import { TEAM_PALETTE } from "@/lib/colors";
import { ROLE_META, ROLES } from "@/lib/permissions";
import { useStore } from "@/lib/store";
import type { Role, User } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Field, Input, Select } from "@/components/ui/field";
import { toastSuccess } from "@/components/ui/toast";

export function UserEditor({
  target,
  onClose,
}: {
  target: User | "new" | null;
  onClose: () => void;
}) {
  const teams = useStore((s) => s.teams);
  const addUser = useStore((s) => s.addUser);
  const updateUser = useStore((s) => s.updateUser);

  const user = target === "new" || target === null ? null : target;
  const open = target !== null;
  const editKey = user?.id ?? "new";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("coordinator");
  const [colorKey, setColorKey] = useState("indigo");
  const [teamId, setTeamId] = useState("");
  const [initialized, setInitialized] = useState<string | null>(null);

  if (open && initialized !== editKey) {
    setName(user?.name ?? "");
    setEmail(user?.email ?? "");
    setRole(user?.role ?? "coordinator");
    setColorKey(user?.colorKey ?? "indigo");
    setTeamId(user?.teamId ?? "");
    setInitialized(editKey);
  }
  if (!open && initialized !== null) setInitialized(null);

  const save = () => {
    const payload = {
      name: name.trim(),
      email: email || undefined,
      role,
      colorKey,
      teamId: role === "supervisor" ? teamId || undefined : undefined,
    };
    if (user) {
      updateUser(user.id, payload);
      toastSuccess("Usuario actualizado", payload.name);
    } else {
      addUser(payload);
      toastSuccess("Usuario creado", payload.name);
    }
    onClose();
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      eyebrow={user ? "Editar usuario" : "Nuevo usuario"}
      title={user ? user.name : "Agregar a alguien"}
      widthClass="sm:w-[26rem]"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button disabled={!name.trim()} onClick={save}>
            {user ? "Guardar cambios" : "Crear usuario"}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <Field label="Nombre completo">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre y apellido"
            autoFocus
          />
        </Field>
        <Field label="Correo">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="persona@vistaverde.do"
          />
        </Field>
        <Field label="Rol">
          <Select value={role} onChange={(e) => setRole(e.target.value as Role)}>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_META[r].label}
              </option>
            ))}
          </Select>
        </Field>

        {role === "supervisor" && (
          <Field label="Equipo a cargo">
            <Select value={teamId} onChange={(e) => setTeamId(e.target.value)}>
              <option value="">Sin equipo asignado</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </Field>
        )}

        <Field label="Color de avatar">
          <div className="flex flex-wrap gap-2">
            {Object.entries(TEAM_PALETTE).map(([key, c]) => (
              <button
                key={key}
                type="button"
                onClick={() => setColorKey(key)}
                className={cn(
                  "size-9 rounded-xl ring-2 ring-offset-2 transition-transform hover:scale-105",
                  colorKey === key ? "ring-slate-900" : "ring-transparent",
                )}
                style={{ backgroundColor: c.hex }}
                aria-label={c.name}
              />
            ))}
          </div>
        </Field>
      </div>
    </Drawer>
  );
}
