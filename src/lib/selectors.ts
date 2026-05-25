import {
  format,
  isWithinInterval,
  parseISO,
  startOfDay,
  startOfMonth,
  subMonths,
} from "date-fns";
import { occurrencesPerMonth } from "./recurrence";
import type { Client, ID, Quote, Service, Team } from "./types";
import { computeTotals } from "./utils";

export function getTeam(teams: Team[], id?: ID): Team | undefined {
  return id ? teams.find((t) => t.id === id) : undefined;
}
export function getClient(clients: Client[], id?: ID): Client | undefined {
  return id ? clients.find((c) => c.id === id) : undefined;
}

export function serviceAmount(s: Pick<Service, "lines" | "taxRate">): number {
  return computeTotals(s.lines, s.taxRate).total;
}
export function quoteAmount(q: Quote): number {
  return computeTotals(q.lines, q.taxRate, q.discount).total;
}
export function clientMonthlyValue(c: Client): number {
  const per = computeTotals(c.serviceTemplate.lines, c.taxRate).total;
  return per * occurrencesPerMonth(c.recurrence);
}

export interface DashboardMetrics {
  revenueMTD: number;
  completedMTD: number;
  pipelineValue: number;
  activeClients: number;
  mrr: number;
  pendingDigitCount: number;
  pendingDigitValue: number;
  unassignedCount: number;
  servicesByStatus: { status: Service["status"]; count: number }[];
  quoteFunnel: { status: Quote["status"]; count: number; value: number }[];
  revenueTrend: { month: string; revenue: number }[];
  teamLoad: {
    teamId: ID;
    name: string;
    colorKey: string;
    hours: number;
    jobs: number;
  }[];
}

export function dashboardMetrics(
  services: Service[],
  quotes: Quote[],
  clients: Client[],
  teams: Team[],
): DashboardMetrics {
  const today = startOfDay(new Date());
  const monthStart = startOfMonth(today);

  let revenueMTD = 0;
  let completedMTD = 0;
  for (const s of services) {
    if (s.status !== "completed") continue;
    const d = parseISO(s.date);
    if (d >= monthStart && d <= today) {
      revenueMTD += serviceAmount(s);
      completedMTD += 1;
    }
  }

  const pipeline = quotes.filter((q) => q.status === "sent" || q.status === "draft");
  const pipelineValue = pipeline.reduce((sum, q) => sum + quoteAmount(q), 0);

  const activeClients = clients.filter((c) => c.active).length;
  const mrr = clients
    .filter((c) => c.active)
    .reduce((sum, c) => sum + clientMonthlyValue(c), 0);

  const pendingDigit = services.filter((s) => s.accountingStatus === "pending");
  const pendingDigitValue = pendingDigit.reduce((s, x) => s + serviceAmount(x), 0);

  const unassignedCount = services.filter((s) => s.status === "unassigned").length;

  const statusOrder: Service["status"][] = [
    "unassigned",
    "scheduled",
    "in_progress",
    "completed",
    "cancelled",
  ];
  const servicesByStatus = statusOrder.map((status) => ({
    status,
    count: services.filter(
      (s) => s.status === status && parseISO(s.date) >= monthStart,
    ).length,
  }));

  const quoteStatuses: Quote["status"][] = ["draft", "sent", "accepted", "rejected"];
  const quoteFunnel = quoteStatuses.map((status) => {
    const items = quotes.filter((q) => q.status === status);
    return {
      status,
      count: items.length,
      value: items.reduce((s, q) => s + quoteAmount(q), 0),
    };
  });

  const revenueTrend: { month: string; revenue: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const m = subMonths(today, i);
    const start = startOfMonth(m);
    const end = i === 0 ? today : startOfMonth(subMonths(today, i - 1));
    const revenue = services
      .filter(
        (s) =>
          s.status === "completed" &&
          isWithinInterval(parseISO(s.date), { start, end }),
      )
      .reduce((sum, s) => sum + serviceAmount(s), 0);
    revenueTrend.push({ month: format(m, "MMM"), revenue });
  }

  const sevenDays = new Date(today);
  sevenDays.setDate(sevenDays.getDate() + 7);
  const teamLoad = teams
    .filter((t) => t.active)
    .map((t) => {
      const jobs = services.filter(
        (s) =>
          s.teamId === t.id &&
          (s.status === "scheduled" || s.status === "in_progress") &&
          parseISO(s.date) >= today &&
          parseISO(s.date) <= sevenDays,
      );
      return {
        teamId: t.id,
        name: t.name,
        colorKey: t.colorKey,
        hours: jobs.reduce((s, j) => s + j.durationMin / 60, 0),
        jobs: jobs.length,
      };
    });

  return {
    revenueMTD,
    completedMTD,
    pipelineValue,
    activeClients,
    mrr,
    pendingDigitCount: pendingDigit.length,
    pendingDigitValue,
    unassignedCount,
    servicesByStatus,
    quoteFunnel,
    revenueTrend,
    teamLoad,
  };
}
