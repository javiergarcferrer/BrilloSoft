"use client";

import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
  CalendarClock,
  Check,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Repeat,
  Send,
  Sparkles,
  Trash2,
  User,
  X,
} from "lucide-react";
import { QUOTE_STATUS_META, QUOTE_TYPE_META } from "@/lib/colors";
import { recurrenceLabel } from "@/lib/recurrence";
import { useStore } from "@/lib/store";
import type { Quote } from "@/lib/types";
import { formatCurrency, lineTotal } from "@/lib/utils";
import { TotalsSummary } from "@/components/shared/totals-summary";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { StatusBadge } from "@/components/ui/badge";
import { Badge } from "@/components/ui/badge";
import { toastInfo, toastSuccess } from "@/components/ui/toast";

function InfoRow({
  icon: Icon,
  children,
}: {
  icon: typeof User;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5 text-sm text-slate-600">
      <Icon className="size-4 shrink-0 text-slate-400" />
      <span className="min-w-0 truncate">{children}</span>
    </div>
  );
}

export function QuoteDetail({
  quote,
  onClose,
  onEdit,
}: {
  quote: Quote | null;
  onClose: () => void;
  onEdit: (q: Quote) => void;
}) {
  const setQuoteStatus = useStore((s) => s.setQuoteStatus);
  const acceptQuote = useStore((s) => s.acceptQuote);
  const deleteQuote = useStore((s) => s.deleteQuote);

  if (!quote) {
    return <Drawer open={false} onClose={onClose}>{null}</Drawer>;
  }

  const statusMeta = QUOTE_STATUS_META[quote.status];
  const typeMeta = QUOTE_TYPE_META[quote.type];

  const schedule =
    quote.type === "recurring" && quote.recurrence
      ? recurrenceLabel(quote.recurrence)
      : quote.oneOffDate
        ? `Puntual el ${format(parseISO(quote.oneOffDate), "EEE, MMM d, yyyy", { locale: es })}`
        : "Servicio puntual";

  const handleAccept = () => {
    const res = acceptQuote(quote.id);
    if (quote.type === "recurring") {
      toastSuccess(
        "Cotización aceptada",
        `Cliente nuevo agregado con ${res.serviceIds.length} servicios programados.`,
      );
    } else {
      toastSuccess(
        "Cotización aceptada",
        "Se agregó un servicio puntual al calendario, sin asignar.",
      );
    }
    onClose();
  };

  return (
    <Drawer
      open={!!quote}
      onClose={onClose}
      eyebrow={quote.number}
      title={quote.clientName}
      widthClass="sm:w-[34rem]"
      footer={<Actions />}
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge meta={statusMeta} />
          <Badge className={typeMeta.badge}>
            {quote.type === "recurring" ? (
              <Repeat className="size-3" />
            ) : (
              <CalendarClock className="size-3" />
            )}
            {typeMeta.label}
          </Badge>
        </div>

        {quote.status === "accepted" && (
          <div className="flex items-start gap-3 rounded-xl bg-emerald-50 p-3.5 text-sm text-emerald-800 ring-1 ring-emerald-200">
            <Sparkles className="mt-0.5 size-4 shrink-0 text-emerald-500" />
            <p>
              {quote.clientId
                ? "Convertida en cliente recurrente. Los trabajos generados están en el calendario."
                : "Convertida en un servicio puntual en el calendario."}
            </p>
          </div>
        )}

        <div className="space-y-2.5 rounded-xl border border-slate-100 bg-slate-50/60 p-4">
          {quote.contactName && (
            <InfoRow icon={User}>{quote.contactName}</InfoRow>
          )}
          {quote.phone && <InfoRow icon={Phone}>{quote.phone}</InfoRow>}
          {quote.email && <InfoRow icon={Mail}>{quote.email}</InfoRow>}
          {quote.address && <InfoRow icon={MapPin}>{quote.address}</InfoRow>}
          <InfoRow icon={CalendarClock}>{schedule}</InfoRow>
        </div>

        <div>
          <h4 className="mb-2 text-sm font-semibold text-slate-900">
            Conceptos
          </h4>
          <div className="overflow-hidden rounded-xl border border-slate-100">
            {quote.lines.map((l, i) => (
              <div
                key={l.id}
                className={`flex items-center justify-between gap-3 px-4 py-2.5 text-sm ${
                  i > 0 ? "border-t border-slate-100" : ""
                }`}
              >
                <span className="min-w-0 truncate text-slate-700">
                  {l.description || "—"}
                  <span className="ml-1.5 text-xs text-slate-400">
                    {l.quantity} × {formatCurrency(l.unitPrice)}
                  </span>
                </span>
                <span className="shrink-0 font-medium tabular-nums text-slate-800">
                  {formatCurrency(lineTotal(l))}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 p-4">
          <TotalsSummary
            lines={quote.lines}
            taxRate={quote.taxRate}
            discount={quote.discount}
          />
        </div>

        {quote.notes && (
          <div>
            <h4 className="mb-1.5 text-sm font-semibold text-slate-900">Notas</h4>
            <p className="text-sm text-slate-500">{quote.notes}</p>
          </div>
        )}
      </div>
    </Drawer>
  );

  function Actions() {
    return (
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            deleteQuote(quote!.id);
            toastInfo("Cotización eliminada", quote!.number);
            onClose();
          }}
        >
          <Trash2 className="size-4" />
          Eliminar
        </Button>
        <div className="flex-1" />
        <Button variant="outline" onClick={() => onEdit(quote!)}>
          <Pencil className="size-4" />
          Editar
        </Button>

        {quote!.status === "draft" && (
          <Button
            onClick={() => {
              setQuoteStatus(quote!.id, "sent");
              toastSuccess("Marcada como enviada", quote!.number);
            }}
          >
            <Send className="size-4" />
            Marcar enviada
          </Button>
        )}

        {quote!.status === "sent" && (
          <>
            <Button
              variant="outline"
              onClick={() => {
                setQuoteStatus(quote!.id, "rejected");
                toastInfo("Cotización rechazada", quote!.number);
              }}
            >
              <X className="size-4" />
              Rechazar
            </Button>
            <Button onClick={handleAccept}>
              <Check className="size-4" />
              Aceptar
            </Button>
          </>
        )}

        {quote!.status === "rejected" && (
          <Button
            variant="outline"
            onClick={() => {
              setQuoteStatus(quote!.id, "draft");
              toastInfo("Reabierta como borrador", quote!.number);
            }}
          >
            Reabrir
          </Button>
        )}
      </div>
    );
  }
}
