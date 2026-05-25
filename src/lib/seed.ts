import {
  addDays,
  differenceInCalendarDays,
  format,
  parseISO,
  startOfDay,
  subDays,
} from "date-fns";
import { nextOccurrences } from "./recurrence";
import type {
  AccountingStatus,
  Client,
  LineItem,
  Quote,
  Service,
  ServiceStatus,
  Team,
} from "./types";
import { uid } from "./utils";

const today = startOfDay(new Date());
const iso = (d: Date) => format(d, "yyyy-MM-dd");

function li(description: string, quantity: number, unitPrice: number): LineItem {
  return { id: uid("li"), description, quantity, unitPrice };
}
function cloneLines(lines: LineItem[]): LineItem[] {
  return lines.map((l) => ({ ...l, id: uid("li") }));
}

export interface SeedData {
  teams: Team[];
  clients: Client[];
  quotes: Quote[];
  services: Service[];
}

export function buildSeed(): SeedData {
  const teams: Team[] = [
    {
      id: "team_north",
      name: "North Crew",
      colorKey: "sky",
      members: ["Ana Reyes", "Luis Mota", "Pedro Gil"],
      active: true,
      createdAt: iso(subDays(today, 120)),
    },
    {
      id: "team_downtown",
      name: "Downtown Crew",
      colorKey: "indigo",
      members: ["María Solís", "Jorge Peña"],
      active: true,
      createdAt: iso(subDays(today, 120)),
    },
    {
      id: "team_south",
      name: "South Crew",
      colorKey: "lime",
      members: ["Carlos Núñez", "Rosa Vega", "Tomás Ruiz"],
      active: true,
      createdAt: iso(subDays(today, 120)),
    },
    {
      id: "team_rapid",
      name: "Rapid Response",
      colorKey: "orange",
      members: ["Elena Cruz", "Sofía Ramos"],
      active: true,
      createdAt: iso(subDays(today, 60)),
    },
  ];

  const anchor = iso(subDays(today, 60));

  const clients: Client[] = [
    {
      id: "client_marbella",
      name: "Hotel Marbella",
      contactName: "Lucía Fernández",
      email: "ops@marbella.example",
      phone: "+1 809 555 0142",
      address: "Av. del Malecón 120",
      recurrence: { frequency: "weekly", interval: 1, weekday: 1, startDate: anchor },
      serviceTemplate: {
        title: "Lobby & guest-room refresh",
        durationMin: 240,
        preferredTeamId: "team_north",
        lines: [li("Lobby & common areas", 1, 180), li("Guest rooms (per 10)", 3, 90)],
      },
      taxRate: 18,
      active: true,
      sourceQuoteId: "quote_marbella",
      createdAt: iso(subDays(today, 58)),
    },
    {
      id: "client_vida",
      name: "Clínica Vida",
      contactName: "Dr. Andrés Mejía",
      email: "facilities@vida.example",
      phone: "+1 809 555 0188",
      address: "C/ Federico Geraldino 45",
      recurrence: { frequency: "biweekly", interval: 1, weekday: 3, startDate: anchor },
      serviceTemplate: {
        title: "Medical-grade deep clean",
        durationMin: 180,
        preferredTeamId: "team_downtown",
        lines: [li("Consultation rooms", 6, 45), li("Sterile disinfection", 1, 220)],
      },
      taxRate: 18,
      active: true,
      createdAt: iso(subDays(today, 50)),
    },
    {
      id: "client_torre",
      name: "Torre Empresarial 9",
      contactName: "Patricia Lugo",
      email: "admin@torre9.example",
      phone: "+1 809 555 0110",
      address: "Av. Winston Churchill 9",
      recurrence: { frequency: "monthly", interval: 1, dayOfMonth: 2, startDate: anchor },
      serviceTemplate: {
        title: "Common-area maintenance",
        durationMin: 300,
        preferredTeamId: "team_south",
        lines: [li("Floors 1–10 common areas", 1, 520), li("Window facade (ground)", 1, 160)],
      },
      taxRate: 18,
      active: true,
      createdAt: iso(subDays(today, 45)),
    },
    {
      id: "client_aurora",
      name: "Café Aurora",
      contactName: "Marco Díaz",
      email: "marco@aurora.example",
      phone: "+1 809 555 0173",
      address: "Plaza Andalucía, local 4",
      recurrence: { frequency: "weekly", interval: 1, weekday: 5, startDate: anchor },
      serviceTemplate: {
        title: "End-of-week kitchen & floor",
        durationMin: 90,
        preferredTeamId: "team_rapid",
        lines: [li("Kitchen degrease", 1, 75), li("Dining floor & glass", 1, 55)],
      },
      taxRate: 18,
      active: true,
      createdAt: iso(subDays(today, 30)),
    },
    {
      id: "client_palmas",
      name: "Residencial Las Palmas",
      contactName: "Comité HOA",
      email: "hoa@laspalmas.example",
      phone: "+1 809 555 0125",
      address: "Calle Las Palmas s/n",
      recurrence: { frequency: "weekly", interval: 1, weekday: 2, startDate: anchor },
      serviceTemplate: {
        title: "Shared areas & pool deck",
        durationMin: 150,
        preferredTeamId: "team_south",
        lines: [li("Lobby, gym & hallways", 1, 140), li("Pool deck", 1, 60)],
      },
      taxRate: 18,
      active: true,
      createdAt: iso(subDays(today, 25)),
    },
  ];

  const startHours = ["07:00", "08:30", "09:30", "13:00", "15:30"];
  const services: Service[] = [];

  clients.forEach((c, idx) => {
    const dates = nextOccurrences(c.recurrence, subDays(today, 20), 7);
    dates.forEach((d) => {
      const dt = parseISO(d);
      const diff = differenceInCalendarDays(dt, today);
      let status: ServiceStatus;
      let accountingStatus: AccountingStatus = "not_applicable";
      let completedAt: string | undefined;
      let digitizedAt: string | undefined;

      if (diff < 0) {
        status = "completed";
        completedAt = `${d}T12:00:00`;
        if (diff <= -9) {
          accountingStatus = "digitized";
          digitizedAt = `${iso(addDays(dt, 1))}T09:00:00`;
        } else {
          accountingStatus = "pending";
        }
      } else if (diff === 0) {
        status = "in_progress";
      } else {
        status = "scheduled";
      }

      services.push({
        id: uid("svc"),
        title: c.serviceTemplate.title,
        clientId: c.id,
        clientName: c.name,
        address: c.address,
        date: d,
        startTime: startHours[idx % startHours.length],
        durationMin: c.serviceTemplate.durationMin,
        teamId: c.serviceTemplate.preferredTeamId,
        status,
        type: "recurring",
        lines: cloneLines(c.serviceTemplate.lines),
        taxRate: c.taxRate,
        accountingStatus,
        completedAt,
        digitizedAt,
        createdAt: iso(subDays(today, 30)),
      });
    });
  });

  // One-off jobs — including unassigned work the coordinator must place.
  const oneOffs: Service[] = [
    {
      id: uid("svc"),
      title: "Move-out deep clean",
      quoteId: "quote_moveout",
      clientName: "Familia Restrepo",
      address: "Res. Mirador Sur, apt 7B",
      date: iso(addDays(today, 2)),
      startTime: "10:00",
      durationMin: 180,
      teamId: undefined,
      status: "unassigned",
      type: "one_off",
      lines: [li("Full apartment deep clean", 1, 240), li("Appliance interior", 1, 60)],
      taxRate: 18,
      accountingStatus: "not_applicable",
      createdAt: iso(subDays(today, 3)),
    },
    {
      id: uid("svc"),
      title: "Post-construction cleanup",
      clientName: "Constructora del Este",
      address: "Obra Av. España km 4",
      date: iso(addDays(today, 4)),
      startTime: "08:00",
      durationMin: 360,
      teamId: undefined,
      status: "unassigned",
      type: "one_off",
      lines: [li("Debris & dust removal", 1, 480), li("Final polish", 1, 180)],
      taxRate: 18,
      accountingStatus: "not_applicable",
      createdAt: iso(subDays(today, 1)),
    },
    {
      id: uid("svc"),
      title: "Event venue turnaround",
      clientName: "Salón Las Magnolias",
      address: "Av. Anacaona 55",
      date: iso(addDays(today, 1)),
      startTime: "18:00",
      durationMin: 120,
      teamId: "team_rapid",
      status: "scheduled",
      type: "one_off",
      lines: [li("Post-event reset & mop", 1, 190)],
      taxRate: 18,
      accountingStatus: "not_applicable",
      createdAt: iso(subDays(today, 2)),
    },
    {
      id: uid("svc"),
      title: "Office one-time deep clean",
      quoteId: "quote_office",
      clientName: "Bufete Álvarez & Co.",
      address: "Torre Acrópolis, piso 12",
      date: iso(subDays(today, 1)),
      startTime: "16:00",
      durationMin: 150,
      teamId: "team_downtown",
      status: "completed",
      type: "one_off",
      lines: [li("Office deep clean", 1, 320), li("Carpet shampoo", 1, 140)],
      taxRate: 18,
      accountingStatus: "pending",
      completedAt: `${iso(subDays(today, 1))}T18:30:00`,
      createdAt: iso(subDays(today, 6)),
    },
  ];
  services.push(...oneOffs);

  const quotes: Quote[] = [
    {
      id: "quote_powerfit",
      number: "Q-1042",
      clientName: "Gimnasio PowerFit",
      contactName: "Ricardo Brea",
      email: "ricardo@powerfit.example",
      phone: "+1 809 555 0201",
      address: "Plaza Central, nivel 2",
      type: "recurring",
      recurrence: { frequency: "weekly", interval: 1, weekday: 4, startDate: iso(today) },
      lines: [li("Equipment sanitization", 1, 160), li("Locker rooms", 2, 70)],
      taxRate: 18,
      discount: 0,
      status: "draft",
      notes: "Awaiting confirmation on weekend slot.",
      createdAt: iso(subDays(today, 2)),
      validUntil: iso(addDays(today, 28)),
    },
    {
      id: "quote_coworking",
      number: "Q-1041",
      clientName: "Coworking Hub",
      contactName: "Daniela Ortiz",
      email: "hello@coworkinghub.example",
      phone: "+1 809 555 0233",
      address: "Av. Sarasota 18",
      type: "recurring",
      recurrence: { frequency: "weekly", interval: 1, weekday: 3, startDate: iso(addDays(today, 3)) },
      lines: [li("Open floor & meeting rooms", 1, 210), li("Kitchen & restrooms", 1, 120)],
      taxRate: 18,
      discount: 30,
      status: "sent",
      notes: "Sent 3 days ago, following up Monday.",
      createdAt: iso(subDays(today, 4)),
      validUntil: iso(addDays(today, 24)),
    },
    {
      id: "quote_wedding",
      number: "Q-1040",
      clientName: "Hacienda La Ceiba",
      contactName: "Eventos La Ceiba",
      email: "eventos@laceiba.example",
      phone: "+1 809 555 0299",
      address: "Carr. Samaná km 12",
      type: "one_off",
      oneOffDate: iso(addDays(today, 9)),
      lines: [li("Pre-event setup clean", 1, 260), li("Post-event full reset", 1, 380)],
      taxRate: 18,
      discount: 0,
      status: "sent",
      createdAt: iso(subDays(today, 5)),
      validUntil: iso(addDays(today, 15)),
    },
    {
      id: "quote_warehouse",
      number: "Q-1035",
      clientName: "Logística Caribe",
      contactName: "Omar Tavárez",
      email: "om@logcaribe.example",
      phone: "+1 809 555 0277",
      address: "Zona Franca, nave 14",
      type: "one_off",
      oneOffDate: iso(subDays(today, 4)),
      lines: [li("Warehouse floor scrub", 1, 640)],
      taxRate: 18,
      discount: 0,
      status: "rejected",
      notes: "Went with in-house staff this quarter.",
      createdAt: iso(subDays(today, 14)),
      validUntil: iso(subDays(today, 2)),
    },
    {
      id: "quote_marbella",
      number: "Q-1012",
      clientName: "Hotel Marbella",
      contactName: "Lucía Fernández",
      email: "ops@marbella.example",
      phone: "+1 809 555 0142",
      address: "Av. del Malecón 120",
      type: "recurring",
      recurrence: { frequency: "weekly", interval: 1, weekday: 1, startDate: anchor },
      lines: [li("Lobby & common areas", 1, 180), li("Guest rooms (per 10)", 3, 90)],
      taxRate: 18,
      discount: 0,
      status: "accepted",
      createdAt: iso(subDays(today, 60)),
      clientId: "client_marbella",
    },
    {
      id: "quote_office",
      number: "Q-1031",
      clientName: "Bufete Álvarez & Co.",
      contactName: "Sr. Álvarez",
      email: "admin@alvarez.example",
      phone: "+1 809 555 0150",
      address: "Torre Acrópolis, piso 12",
      type: "one_off",
      oneOffDate: iso(subDays(today, 1)),
      lines: [li("Office deep clean", 1, 320), li("Carpet shampoo", 1, 140)],
      taxRate: 18,
      discount: 0,
      status: "accepted",
      createdAt: iso(subDays(today, 8)),
    },
  ];

  return { teams, clients, quotes, services };
}
