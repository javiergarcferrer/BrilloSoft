"use client";

import { addDays, format, getDay } from "date-fns";
import { useState } from "react";
import { useStore } from "@/lib/store";
import type { LineItem, Quote, QuoteType, Recurrence } from "@/lib/types";
import { computeTotals, formatCurrency, uid } from "@/lib/utils";
import { LineItemsEditor } from "@/components/shared/line-items-editor";
import { RecurrenceEditor } from "@/components/shared/recurrence-editor";
import { TotalsSummary } from "@/components/shared/totals-summary";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Segmented } from "@/components/ui/segmented";
import { toastSuccess } from "@/components/ui/toast";

const todayStr = () => format(new Date(), "yyyy-MM-dd");

interface FormState {
  id: string;
  number: string;
  clientName: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  type: QuoteType;
  recurrence: Recurrence;
  oneOffDate: string;
  lines: LineItem[];
  taxRate: number;
  discount: number;
  validUntil: string;
  notes: string;
  status: Quote["status"];
  createdAt: string;
  clientId?: string;
  generatedServiceIds?: string[];
}

function blankForm(nextNumber: string): FormState {
  return {
    id: uid("quote"),
    number: nextNumber,
    clientName: "",
    contactName: "",
    email: "",
    phone: "",
    address: "",
    type: "one_off",
    recurrence: {
      frequency: "weekly",
      interval: 1,
      weekday: getDay(new Date()) || 1,
      dayOfMonth: 1,
      startDate: todayStr(),
    },
    oneOffDate: format(addDays(new Date(), 3), "yyyy-MM-dd"),
    lines: [{ id: uid("li"), description: "", quantity: 1, unitPrice: 0 }],
    taxRate: 18,
    discount: 0,
    validUntil: format(addDays(new Date(), 30), "yyyy-MM-dd"),
    notes: "",
    status: "draft",
    createdAt: new Date().toISOString(),
  };
}

function fromQuote(q: Quote): FormState {
  return {
    id: q.id,
    number: q.number,
    clientName: q.clientName,
    contactName: q.contactName ?? "",
    email: q.email ?? "",
    phone: q.phone ?? "",
    address: q.address ?? "",
    type: q.type,
    recurrence:
      q.recurrence ?? {
        frequency: "weekly",
        interval: 1,
        weekday: 1,
        dayOfMonth: 1,
        startDate: todayStr(),
      },
    oneOffDate: q.oneOffDate ?? todayStr(),
    lines: q.lines.length
      ? q.lines
      : [{ id: uid("li"), description: "", quantity: 1, unitPrice: 0 }],
    taxRate: q.taxRate,
    discount: q.discount,
    validUntil: q.validUntil ?? todayStr(),
    notes: q.notes ?? "",
    status: q.status,
    createdAt: q.createdAt,
    clientId: q.clientId,
    generatedServiceIds: q.generatedServiceIds,
  };
}

export function QuoteEditor({
  target,
  nextNumber,
  onClose,
}: {
  target: Quote | "new" | null;
  nextNumber: string;
  onClose: () => void;
}) {
  const upsertQuote = useStore((s) => s.upsertQuote);
  const quote = target === "new" || target === null ? null : target;
  const open = target !== null;
  const editKey = quote?.id ?? "new";

  const [form, setForm] = useState<FormState>(() => blankForm(nextNumber));
  const [initialized, setInitialized] = useState<string | null>(null);

  if (open && initialized !== editKey) {
    setForm(quote ? fromQuote(quote) : blankForm(nextNumber));
    setInitialized(editKey);
  }
  if (!open && initialized !== null) setInitialized(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const total = computeTotals(form.lines, form.taxRate, form.discount).total;

  const save = () => {
    const quoteOut: Quote = {
      id: form.id,
      number: form.number,
      clientName: form.clientName.trim(),
      contactName: form.contactName || undefined,
      email: form.email || undefined,
      phone: form.phone || undefined,
      address: form.address || undefined,
      type: form.type,
      recurrence: form.type === "recurring" ? form.recurrence : undefined,
      oneOffDate: form.type === "one_off" ? form.oneOffDate : undefined,
      lines: form.lines.filter((l) => l.description.trim() || l.unitPrice > 0),
      taxRate: form.taxRate,
      discount: form.discount,
      status: form.status,
      notes: form.notes || undefined,
      createdAt: form.createdAt,
      validUntil: form.validUntil || undefined,
      clientId: form.clientId,
      generatedServiceIds: form.generatedServiceIds,
    };
    upsertQuote(quoteOut);
    toastSuccess(quote ? "Quote updated" : "Quote created", `${form.number} · ${form.clientName || "Untitled"}`);
    onClose();
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      eyebrow={quote ? `Edit ${quote.number}` : "New quote"}
      title={quote ? quote.clientName || "Quote" : "Create a quote"}
      widthClass="sm:w-[40rem]"
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
            <Button disabled={!form.clientName.trim()} onClick={save}>
              {quote ? "Save changes" : "Create quote"}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        <section>
          <h4 className="mb-3 text-sm font-semibold text-slate-900">Client</h4>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Client name" className="sm:col-span-2">
              <Input
                value={form.clientName}
                onChange={(e) => set("clientName", e.target.value)}
                placeholder="Company or person"
                autoFocus
              />
            </Field>
            <Field label="Contact person">
              <Input
                value={form.contactName}
                onChange={(e) => set("contactName", e.target.value)}
              />
            </Field>
            <Field label="Phone">
              <Input
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
              />
            </Field>
            <Field label="Email">
              <Input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
              />
            </Field>
            <Field label="Address">
              <Input
                value={form.address}
                onChange={(e) => set("address", e.target.value)}
              />
            </Field>
          </div>
        </section>

        <section>
          <h4 className="mb-3 text-sm font-semibold text-slate-900">
            Service type
          </h4>
          <Segmented<QuoteType>
            value={form.type}
            onChange={(v) => set("type", v)}
            options={[
              { value: "one_off", label: "One-off" },
              { value: "recurring", label: "Recurring" },
            ]}
          />
          <div className="mt-4">
            {form.type === "one_off" ? (
              <Field label="Service date" className="sm:max-w-xs">
                <Input
                  type="date"
                  value={form.oneOffDate}
                  onChange={(e) => set("oneOffDate", e.target.value)}
                />
              </Field>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <RecurrenceEditor
                    value={form.recurrence}
                    onChange={(r) => set("recurrence", r)}
                  />
                </div>
                <Field label="Starts on" className="sm:max-w-xs">
                  <Input
                    type="date"
                    value={form.recurrence.startDate}
                    onChange={(e) =>
                      set("recurrence", {
                        ...form.recurrence,
                        startDate: e.target.value,
                      })
                    }
                  />
                </Field>
              </div>
            )}
          </div>
        </section>

        <section>
          <h4 className="mb-3 text-sm font-semibold text-slate-900">
            Line items
          </h4>
          <LineItemsEditor
            lines={form.lines}
            onChange={(lines) => set("lines", lines)}
          />
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tax rate (%)">
                <Input
                  type="number"
                  min={0}
                  step="0.5"
                  value={form.taxRate}
                  onChange={(e) => set("taxRate", Number(e.target.value))}
                />
              </Field>
              <Field label="Discount">
                <Input
                  type="number"
                  min={0}
                  step="1"
                  value={form.discount}
                  onChange={(e) => set("discount", Number(e.target.value))}
                />
              </Field>
            </div>
            <Field label="Valid until">
              <Input
                type="date"
                value={form.validUntil}
                onChange={(e) => set("validUntil", e.target.value)}
              />
            </Field>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <TotalsSummary
              lines={form.lines}
              taxRate={form.taxRate}
              discount={form.discount}
            />
          </div>
        </section>

        <Field label="Notes">
          <Textarea
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Internal notes, special instructions…"
          />
        </Field>
      </div>
    </Drawer>
  );
}
