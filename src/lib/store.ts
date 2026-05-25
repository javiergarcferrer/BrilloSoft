"use client";

import { addDays, format, startOfDay } from "date-fns";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { nextOccurrences } from "./recurrence";
import { buildSeed } from "./seed";
import type {
  Client,
  ID,
  LineItem,
  Quote,
  Service,
  ServiceStatus,
  Team,
} from "./types";
import { uid } from "./utils";

const nowIso = () => new Date().toISOString();
const todayStr = () => format(startOfDay(new Date()), "yyyy-MM-dd");
const cloneLines = (lines: LineItem[]): LineItem[] =>
  lines.map((l) => ({ ...l, id: uid("li") }));

export interface DataState {
  teams: Team[];
  clients: Client[];
  quotes: Quote[];
  services: Service[];

  /* teams */
  addTeam: (team: Omit<Team, "id" | "createdAt">) => Team;
  updateTeam: (id: ID, patch: Partial<Team>) => void;
  removeTeam: (id: ID) => void;

  /* quotes */
  upsertQuote: (quote: Quote) => void;
  deleteQuote: (id: ID) => void;
  setQuoteStatus: (id: ID, status: Quote["status"]) => void;
  /** accept → spawn a one-off service, or a client + its first services */
  acceptQuote: (id: ID) => { clientId?: ID; serviceIds: ID[] };

  /* clients */
  upsertClient: (client: Client) => void;
  updateClient: (id: ID, patch: Partial<Client>) => void;
  toggleClientActive: (id: ID) => void;
  generateServicesForClient: (
    id: ID,
    count?: number,
    from?: Date,
  ) => ID[];

  /* services */
  upsertService: (service: Service) => void;
  updateService: (id: ID, patch: Partial<Service>) => void;
  assignTeam: (serviceId: ID, teamId: ID | undefined) => void;
  setServiceStatus: (serviceId: ID, status: ServiceStatus) => void;
  moveService: (serviceId: ID, date: string, startTime?: string) => void;
  deleteService: (id: ID) => void;

  /* accounting */
  markDigitized: (serviceId: ID) => void;
  markAllPendingDigitized: () => void;

  resetAll: () => void;
}

function serviceFromTemplate(c: Client, date: string): Service {
  const assigned = c.serviceTemplate.preferredTeamId;
  return {
    id: uid("svc"),
    title: c.serviceTemplate.title,
    clientId: c.id,
    clientName: c.name,
    address: c.address,
    date,
    startTime: "09:00",
    durationMin: c.serviceTemplate.durationMin,
    teamId: assigned,
    status: assigned ? "scheduled" : "unassigned",
    type: "recurring",
    lines: cloneLines(c.serviceTemplate.lines),
    taxRate: c.taxRate,
    accountingStatus: "not_applicable",
    createdAt: nowIso(),
  };
}

function clientFromQuote(q: Quote): Client {
  return {
    id: uid("client"),
    name: q.clientName,
    contactName: q.contactName,
    email: q.email,
    phone: q.phone,
    address: q.address,
    recurrence: q.recurrence ?? {
      frequency: "weekly",
      interval: 1,
      weekday: 1,
      startDate: todayStr(),
    },
    serviceTemplate: {
      title: q.lines[0]?.description ?? "Recurring service",
      durationMin: 120,
      lines: cloneLines(q.lines),
    },
    taxRate: q.taxRate,
    active: true,
    sourceQuoteId: q.id,
    createdAt: nowIso(),
  };
}

function serviceFromOneOff(q: Quote): Service {
  return {
    id: uid("svc"),
    title: q.lines[0]?.description ?? "One-off service",
    quoteId: q.id,
    clientName: q.clientName,
    address: q.address,
    date: q.oneOffDate ?? format(addDays(startOfDay(new Date()), 3), "yyyy-MM-dd"),
    startTime: "09:00",
    durationMin: 120,
    teamId: undefined,
    status: "unassigned",
    type: "one_off",
    lines: cloneLines(q.lines),
    taxRate: q.taxRate,
    accountingStatus: "not_applicable",
    createdAt: nowIso(),
  };
}

export const useStore = create<DataState>()(
  persist(
    (set, get) => ({
      ...buildSeed(),

      addTeam: (team) => {
        const created: Team = { ...team, id: uid("team"), createdAt: nowIso() };
        set((s) => ({ teams: [...s.teams, created] }));
        return created;
      },
      updateTeam: (id, patch) =>
        set((s) => ({
          teams: s.teams.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        })),
      removeTeam: (id) =>
        set((s) => ({
          teams: s.teams.filter((t) => t.id !== id),
          // unassign services that pointed at this team
          services: s.services.map((sv) =>
            sv.teamId === id
              ? { ...sv, teamId: undefined, status: sv.status === "scheduled" ? "unassigned" : sv.status }
              : sv,
          ),
        })),

      upsertQuote: (quote) =>
        set((s) => {
          const exists = s.quotes.some((q) => q.id === quote.id);
          return {
            quotes: exists
              ? s.quotes.map((q) => (q.id === quote.id ? quote : q))
              : [quote, ...s.quotes],
          };
        }),
      deleteQuote: (id) =>
        set((s) => ({ quotes: s.quotes.filter((q) => q.id !== id) })),
      setQuoteStatus: (id, status) =>
        set((s) => ({
          quotes: s.quotes.map((q) => (q.id === id ? { ...q, status } : q)),
        })),

      acceptQuote: (id) => {
        const q = get().quotes.find((x) => x.id === id);
        if (!q) return { serviceIds: [] };

        if (q.type === "one_off") {
          const svc = serviceFromOneOff(q);
          set((s) => ({
            services: [...s.services, svc],
            quotes: s.quotes.map((x) =>
              x.id === id
                ? { ...x, status: "accepted", generatedServiceIds: [svc.id] }
                : x,
            ),
          }));
          return { serviceIds: [svc.id] };
        }

        const client = clientFromQuote(q);
        const dates = nextOccurrences(client.recurrence, new Date(), 6);
        const created = dates.map((d) => serviceFromTemplate(client, d));
        set((s) => ({
          clients: [...s.clients, client],
          services: [...s.services, ...created],
          quotes: s.quotes.map((x) =>
            x.id === id
              ? {
                  ...x,
                  status: "accepted",
                  clientId: client.id,
                  generatedServiceIds: created.map((c) => c.id),
                }
              : x,
          ),
        }));
        return { clientId: client.id, serviceIds: created.map((c) => c.id) };
      },

      upsertClient: (client) =>
        set((s) => {
          const exists = s.clients.some((c) => c.id === client.id);
          return {
            clients: exists
              ? s.clients.map((c) => (c.id === client.id ? client : c))
              : [client, ...s.clients],
          };
        }),
      updateClient: (id, patch) =>
        set((s) => ({
          clients: s.clients.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        })),
      toggleClientActive: (id) =>
        set((s) => ({
          clients: s.clients.map((c) =>
            c.id === id ? { ...c, active: !c.active } : c,
          ),
        })),
      generateServicesForClient: (id, count = 4, from = new Date()) => {
        const client = get().clients.find((c) => c.id === id);
        if (!client) return [];
        const existing = new Set(
          get()
            .services.filter((s) => s.clientId === id)
            .map((s) => s.date),
        );
        const dates = nextOccurrences(client.recurrence, from, count + existing.size);
        const fresh = dates.filter((d) => !existing.has(d)).slice(0, count);
        const created = fresh.map((d) => serviceFromTemplate(client, d));
        if (created.length) set((s) => ({ services: [...s.services, ...created] }));
        return created.map((c) => c.id);
      },

      upsertService: (service) =>
        set((s) => {
          const exists = s.services.some((x) => x.id === service.id);
          return {
            services: exists
              ? s.services.map((x) => (x.id === service.id ? service : x))
              : [...s.services, service],
          };
        }),
      updateService: (id, patch) =>
        set((s) => ({
          services: s.services.map((sv) =>
            sv.id === id ? { ...sv, ...patch } : sv,
          ),
        })),
      assignTeam: (serviceId, teamId) =>
        set((s) => ({
          services: s.services.map((sv) => {
            if (sv.id !== serviceId) return sv;
            let status = sv.status;
            if (!teamId && sv.status === "scheduled") status = "unassigned";
            if (teamId && sv.status === "unassigned") status = "scheduled";
            return { ...sv, teamId, status };
          }),
        })),
      setServiceStatus: (serviceId, status) =>
        set((s) => ({
          services: s.services.map((sv) => {
            if (sv.id !== serviceId) return sv;
            const next: Service = { ...sv, status };
            if (status === "completed") {
              next.completedAt = nowIso();
              if (sv.accountingStatus === "not_applicable") {
                next.accountingStatus = "pending";
              }
            }
            if (status !== "completed" && sv.status === "completed") {
              // reverting an accidental completion
              next.completedAt = undefined;
              if (sv.accountingStatus === "pending") {
                next.accountingStatus = "not_applicable";
              }
            }
            return next;
          }),
        })),
      moveService: (serviceId, date, startTime) =>
        set((s) => ({
          services: s.services.map((sv) =>
            sv.id === serviceId
              ? { ...sv, date, startTime: startTime ?? sv.startTime }
              : sv,
          ),
        })),
      deleteService: (id) =>
        set((s) => ({ services: s.services.filter((sv) => sv.id !== id) })),

      markDigitized: (serviceId) =>
        set((s) => ({
          services: s.services.map((sv) =>
            sv.id === serviceId
              ? { ...sv, accountingStatus: "digitized", digitizedAt: nowIso() }
              : sv,
          ),
        })),
      markAllPendingDigitized: () =>
        set((s) => ({
          services: s.services.map((sv) =>
            sv.accountingStatus === "pending"
              ? { ...sv, accountingStatus: "digitized", digitizedAt: nowIso() }
              : sv,
          ),
        })),

      resetAll: () => set({ ...buildSeed() }),
    }),
    {
      name: "brillosoft-store-v1",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        teams: s.teams,
        clients: s.clients,
        quotes: s.quotes,
        services: s.services,
      }),
    },
  ),
);
