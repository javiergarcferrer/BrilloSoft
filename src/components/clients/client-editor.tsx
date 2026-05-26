"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useState } from "react";
import { useStore } from "@/lib/store";
import type { Client, LineItem, Recurrence } from "@/lib/types";
import { uid } from "@/lib/utils";
import { LineItemsEditor } from "@/components/shared/line-items-editor";
import { RecurrenceEditor } from "@/components/shared/recurrence-editor";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Field, Input, Select } from "@/components/ui/field";
import { toastSuccess } from "@/components/ui/toast";

const todayStr = () => format(new Date(), "yyyy-MM-dd", { locale: es });

interface FormState {
  id: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  recurrence: Recurrence;
  templateTitle: string;
  durationMin: number;
  preferredTeamId: string;
  lines: LineItem[];
  taxRate: number;
  active: boolean;
  createdAt: string;
  sourceQuoteId?: string;
}

function blank(): FormState {
  return {
    id: uid("client"),
    name: "",
    contactName: "",
    email: "",
    phone: "",
    address: "",
    recurrence: {
      frequency: "weekly",
      interval: 1,
      weekday: 1,
      dayOfMonth: 1,
      startDate: todayStr(),
    },
    templateTitle: "Servicio de limpieza recurrente",
    durationMin: 120,
    preferredTeamId: "",
    lines: [{ id: uid("li"), description: "", quantity: 1, unitPrice: 0 }],
    taxRate: 18,
    active: true,
    createdAt: new Date().toISOString(),
  };
}

function fromClient(c: Client): FormState {
  return {
    id: c.id,
    name: c.name,
    contactName: c.contactName ?? "",
    email: c.email ?? "",
    phone: c.phone ?? "",
    address: c.address ?? "",
    recurrence: c.recurrence,
    templateTitle: c.serviceTemplate.title,
    durationMin: c.serviceTemplate.durationMin,
    preferredTeamId: c.serviceTemplate.preferredTeamId ?? "",
    lines: c.serviceTemplate.lines.length
      ? c.serviceTemplate.lines
      : [{ id: uid("li"), description: "", quantity: 1, unitPrice: 0 }],
    taxRate: c.taxRate,
    active: c.active,
    createdAt: c.createdAt,
    sourceQuoteId: c.sourceQuoteId,
  };
}

export function ClientEditor({
  target,
  onClose,
}: {
  target: Client | "new" | null;
  onClose: () => void;
}) {
  const teams = useStore((s) => s.teams);
  const upsertClient = useStore((s) => s.upsertClient);
  const generate = useStore((s) => s.generateServicesForClient);

  const client = target === "new" || target === null ? null : target;
  const open = target !== null;
  const editKey = client?.id ?? "new";

  const [form, setForm] = useState<FormState>(() => blank());
  const [initialized, setInitialized] = useState<string | null>(null);

  if (open && initialized !== editKey) {
    setForm(client ? fromClient(client) : blank());
    setInitialized(editKey);
  }
  if (!open && initialized !== null) setInitialized(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const save = () => {
    const out: Client = {
      id: form.id,
      name: form.name.trim(),
      contactName: form.contactName || undefined,
      email: form.email || undefined,
      phone: form.phone || undefined,
      address: form.address || undefined,
      recurrence: form.recurrence,
      serviceTemplate: {
        title: form.templateTitle,
        durationMin: form.durationMin,
        preferredTeamId: form.preferredTeamId || undefined,
        lines: form.lines.filter((l) => l.description.trim() || l.unitPrice > 0),
      },
      taxRate: form.taxRate,
      active: form.active,
      createdAt: form.createdAt,
      sourceQuoteId: form.sourceQuoteId,
    };
    upsertClient(out);
    if (!client) {
      generate(out.id, 4);
      toastSuccess("Cliente creado", `${out.name} · 4 servicios programados`);
    } else {
      toastSuccess("Cliente actualizado", out.name);
    }
    onClose();
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      eyebrow={client ? "Editar cliente" : "Nuevo cliente"}
      title={client ? client.name : "Crear un cliente recurrente"}
      widthClass="sm:w-[38rem]"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button disabled={!form.name.trim()} onClick={save}>
            {client ? "Guardar cambios" : "Crear cliente"}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <section>
          <h4 className="mb-3 text-sm font-semibold text-slate-900">Datos</h4>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nombre del cliente" className="sm:col-span-2">
              <Input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Empresa o persona"
                autoFocus
              />
            </Field>
            <Field label="Persona de contacto">
              <Input
                value={form.contactName}
                onChange={(e) => set("contactName", e.target.value)}
              />
            </Field>
            <Field label="Teléfono">
              <Input
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
              />
            </Field>
            <Field label="Correo">
              <Input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
              />
            </Field>
            <Field label="Dirección">
              <Input
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
              />
            </Field>
          </div>
        </section>

        <section>
          <h4 className="mb-3 text-sm font-semibold text-slate-900">Frecuencia</h4>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <RecurrenceEditor
                value={form.recurrence}
                onChange={(r) => set("recurrence", r)}
              />
            </div>
            <Field label="Equipo preferido">
              <Select
                value={form.preferredTeamId}
                onChange={(e) => set("preferredTeamId", e.target.value)}
              >
                <option value="">Sin equipo — asignar luego</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Duración (min)">
              <Input
                type="number"
                min={15}
                step="15"
                value={form.durationMin}
                onChange={(e) => set("durationMin", Number(e.target.value))}
              />
            </Field>
          </div>
        </section>

        <section>
          <h4 className="mb-3 text-sm font-semibold text-slate-900">
            Plantilla de servicio
          </h4>
          <Field label="Título del servicio" className="mb-3">
            <Input
              value={form.templateTitle}
              onChange={(e) => set("templateTitle", e.target.value)}
            />
          </Field>
          <LineItemsEditor
            lines={form.lines}
            onChange={(lines) => set("lines", lines)}
          />
          <Field label="ITBIS (%)" className="mt-3 sm:max-w-[10rem]">
            <Input
              type="number"
              min={0}
              step="0.5"
              value={form.taxRate}
              onChange={(e) => set("taxRate", Number(e.target.value))}
            />
          </Field>
        </section>
      </div>
    </Drawer>
  );
}
