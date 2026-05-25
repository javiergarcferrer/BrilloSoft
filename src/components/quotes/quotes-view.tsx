"use client";

import { format, parseISO } from "date-fns";
import { CalendarClock, FileText, Plus, Repeat } from "lucide-react";
import { useMemo, useState } from "react";
import { useHydrated } from "@/hooks/use-hydrated";
import {
  QUOTE_STATUS_META,
  QUOTE_STATUS_ORDER,
  QUOTE_TYPE_META,
} from "@/lib/colors";
import { recurrenceLabel } from "@/lib/recurrence";
import { quoteAmount } from "@/lib/selectors";
import { useStore } from "@/lib/store";
import type { Quote } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterChips } from "@/components/ui/filter-chips";
import { Skeleton } from "@/components/ui/skeleton";
import { QuoteDetail } from "./quote-detail";
import { QuoteEditor } from "./quote-editor";

function nextQuoteNumber(quotes: Quote[]): string {
  const max = quotes.reduce((m, q) => {
    const n = parseInt(q.number.replace(/\D/g, ""), 10);
    return Number.isFinite(n) ? Math.max(m, n) : m;
  }, 1000);
  return `Q-${max + 1}`;
}

export function QuotesView() {
  const hydrated = useHydrated();
  const quotes = useStore((s) => s.quotes);
  const [statusFilter, setStatusFilter] = useState("all");
  const [detail, setDetail] = useState<Quote | null>(null);
  const [editorTarget, setEditorTarget] = useState<Quote | "new" | null>(null);

  const nextNumber = useMemo(() => nextQuoteNumber(quotes), [quotes]);

  const pipeline = quotes
    .filter((q) => q.status === "draft" || q.status === "sent")
    .reduce((s, q) => s + quoteAmount(q), 0);
  const acceptedValue = quotes
    .filter((q) => q.status === "accepted")
    .reduce((s, q) => s + quoteAmount(q), 0);

  const filtered = useMemo(
    () =>
      statusFilter === "all"
        ? quotes
        : quotes.filter((q) => q.status === statusFilter),
    [quotes, statusFilter],
  );

  const columns: Column<Quote>[] = [
    {
      key: "number",
      header: "Quote",
      sortValue: (q) => parseInt(q.number.replace(/\D/g, ""), 10) || 0,
      render: (q) => (
        <div>
          <div className="font-semibold text-slate-900">{q.number}</div>
          <div className="text-xs text-slate-400">
            {format(parseISO(q.createdAt.slice(0, 10)), "MMM d")}
          </div>
        </div>
      ),
    },
    {
      key: "client",
      header: "Client",
      sortValue: (q) => q.clientName.toLowerCase(),
      render: (q) => (
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-800">{q.clientName}</span>
          <Badge className={QUOTE_TYPE_META[q.type].badge}>
            {q.type === "recurring" ? (
              <Repeat className="size-3" />
            ) : (
              <CalendarClock className="size-3" />
            )}
            {QUOTE_TYPE_META[q.type].label}
          </Badge>
        </div>
      ),
    },
    {
      key: "schedule",
      header: "Schedule",
      hideOnMobile: true,
      render: (q) => (
        <span className="text-sm text-slate-500">
          {q.type === "recurring" && q.recurrence
            ? recurrenceLabel(q.recurrence)
            : q.oneOffDate
              ? format(parseISO(q.oneOffDate), "MMM d, yyyy")
              : "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortValue: (q) => QUOTE_STATUS_ORDER.indexOf(q.status),
      render: (q) => <StatusBadge meta={QUOTE_STATUS_META[q.status]} />,
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      sortValue: (q) => quoteAmount(q),
      render: (q) => (
        <span className="font-semibold tabular-nums text-slate-900">
          {formatCurrency(quoteAmount(q))}
        </span>
      ),
    },
  ];

  const statusOptions = [
    { value: "all", label: "All", count: quotes.length },
    ...QUOTE_STATUS_ORDER.map((s) => ({
      value: s,
      label: QUOTE_STATUS_META[s].label,
      hex: QUOTE_STATUS_META[s].hex,
      count: quotes.filter((q) => q.status === s).length,
    })),
  ];

  return (
    <div>
      <PageHeader
        title="Quotes"
        description="Build line-item quotes, then accept to spin up jobs or recurring clients."
        actions={
          <Button onClick={() => setEditorTarget("new")}>
            <Plus className="size-4" />
            New quote
          </Button>
        }
      />

      {hydrated && (
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Card className="p-4">
            <p className="text-xs font-medium text-slate-500">Open pipeline</p>
            <p className="mt-1 text-xl font-bold text-slate-900">
              {formatCurrency(pipeline)}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-medium text-slate-500">Accepted value</p>
            <p className="mt-1 text-xl font-bold text-emerald-600">
              {formatCurrency(acceptedValue)}
            </p>
          </Card>
          <Card className="col-span-2 p-4 sm:col-span-1">
            <p className="text-xs font-medium text-slate-500">Total quotes</p>
            <p className="mt-1 text-xl font-bold text-slate-900">
              {quotes.length}
            </p>
          </Card>
        </div>
      )}

      {!hydrated ? (
        <Skeleton className="h-80 w-full" />
      ) : quotes.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No quotes yet"
          description="Create your first quote to start building your pipeline."
          action={
            <Button onClick={() => setEditorTarget("new")}>
              <Plus className="size-4" />
              New quote
            </Button>
          }
        />
      ) : (
        <DataTable
          columns={columns}
          rows={filtered}
          getRowId={(q) => q.id}
          onRowClick={(q) => setDetail(q)}
          initialSort={{ key: "number", dir: "desc" }}
          searchText={(q) => `${q.number} ${q.clientName} ${q.contactName ?? ""}`}
          searchPlaceholder="Search quotes…"
          filters={
            <FilterChips
              value={statusFilter}
              onChange={setStatusFilter}
              options={statusOptions}
            />
          }
        />
      )}

      <QuoteDetail
        quote={detail}
        onClose={() => setDetail(null)}
        onEdit={(q) => {
          setDetail(null);
          setEditorTarget(q);
        }}
      />
      <QuoteEditor
        target={editorTarget}
        nextNumber={nextNumber}
        onClose={() => setEditorTarget(null)}
      />
    </div>
  );
}
