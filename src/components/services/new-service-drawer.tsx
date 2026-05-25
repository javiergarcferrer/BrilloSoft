"use client";

import { format } from "date-fns";
import { useState } from "react";
import { useStore } from "@/lib/store";
import type { LineItem, Service, ServiceType } from "@/lib/types";
import { computeTotals, formatCurrency, uid } from "@/lib/utils";
import { LineItemsEditor } from "@/components/shared/line-items-editor";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Field, Input, Select } from "@/components/ui/field";
import { Segmented } from "@/components/ui/segmented";
import { toastSuccess } from "@/components/ui/toast";

export function NewServiceDrawer({
  open,
  defaultDate,
  onClose,
  onCreated,
}: {
  open: boolean;
  defaultDate?: string;
  onClose: () => void;
  onCreated?: (id: string) => void;
}) {
  const teams = useStore((s) => s.teams);
  const upsertService = useStore((s) => s.upsertService);

  const [title, setTitle] = useState("");
  const [clientName, setClientName] = useState("");
  const [address, setAddress] = useState("");
  const [date, setDate] = useState(defaultDate ?? format(new Date(), "yyyy-MM-dd"));
  const [startTime, setStartTime] = useState("09:00");
  const [durationMin, setDurationMin] = useState(120);
  const [teamId, setTeamId] = useState("");
  const [type, setType] = useState<ServiceType>("one_off");
  const [taxRate, setTaxRate] = useState(18);
  const [lines, setLines] = useState<LineItem[]>([
    { id: uid("li"), description: "", quantity: 1, unitPrice: 0 },
  ]);
  const [synced, setSynced] = useState<string | null>(null);

  // re-seed the date whenever the drawer opens (possibly from a day cell)
  const key = open ? defaultDate ?? "today" : null;
  if (open && synced !== key) {
    setTitle("");
    setClientName("");
    setAddress("");
    setDate(defaultDate ?? format(new Date(), "yyyy-MM-dd"));
    setStartTime("09:00");
    setDurationMin(120);
    setTeamId("");
    setType("one_off");
    setTaxRate(18);
    setLines([{ id: uid("li"), description: "", quantity: 1, unitPrice: 0 }]);
    setSynced(key);
  }
  if (!open && synced !== null) setSynced(null);

  const total = computeTotals(lines, taxRate).total;

  const create = () => {
    const id = uid("svc");
    const svc: Service = {
      id,
      title: title.trim() || "Cleaning service",
      clientName: clientName.trim() || "Walk-in",
      address: address || undefined,
      date,
      startTime,
      durationMin,
      teamId: teamId || undefined,
      status: teamId ? "scheduled" : "unassigned",
      type,
      lines: lines.filter((l) => l.description.trim() || l.unitPrice > 0),
      taxRate,
      accountingStatus: "not_applicable",
      createdAt: new Date().toISOString(),
    };
    upsertService(svc);
    toastSuccess("Service created", `${svc.title} · ${format(new Date(date), "MMM d")}`);
    onCreated?.(id);
    onClose();
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      eyebrow="New service"
      title="Schedule a job"
      widthClass="sm:w-[36rem]"
      footer={
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm">
            <span className="text-slate-400">Total</span>{" "}
            <span className="text-lg font-bold text-slate-900">
              {formatCurrency(total)}
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={create}>Create service</Button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Service title" className="sm:col-span-2">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Deep clean"
              autoFocus
            />
          </Field>
          <Field label="Client">
            <Input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Client name"
            />
          </Field>
          <Field label="Address">
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </Field>
        </div>

        <Segmented<ServiceType>
          value={type}
          onChange={setType}
          options={[
            { value: "one_off", label: "One-off" },
            { value: "recurring", label: "Recurring" },
          ]}
        />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Field label="Date" className="col-span-2 sm:col-span-2">
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </Field>
          <Field label="Time">
            <Input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </Field>
          <Field label="Duration">
            <Input
              type="number"
              min={15}
              step="15"
              value={durationMin}
              onChange={(e) => setDurationMin(Number(e.target.value))}
            />
          </Field>
        </div>

        <Field label="Assign team">
          <Select value={teamId} onChange={(e) => setTeamId(e.target.value)}>
            <option value="">Leave unassigned</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </Field>

        <div>
          <h4 className="mb-2 text-sm font-semibold text-slate-900">
            Line items
          </h4>
          <LineItemsEditor lines={lines} onChange={setLines} />
        </div>

        <Field label="Tax rate (%)" className="sm:max-w-[10rem]">
          <Input
            type="number"
            min={0}
            step="0.5"
            value={taxRate}
            onChange={(e) => setTaxRate(Number(e.target.value))}
          />
        </Field>
      </div>
    </Drawer>
  );
}
