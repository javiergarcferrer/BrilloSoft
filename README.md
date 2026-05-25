# BrilloSoft

Operations CRM for a cleaning-services company. One workspace for the three
roles that run the business:

- **Coordinator** — an interactive calendar (month / week / day) to organize
  crews across one-off and recurring jobs, with drag-to-reschedule, an
  "needs a crew" worklist, and a live status flow (unassigned → scheduled →
  in progress → completed).
- **Sales / quoting** — line-item quotes that are either one-off or recurring.
  Accepting a quote spins up a one-off job, or a recurring **client** plus its
  first scheduled services.
- **Accountant** — a digitization queue: every completed service becomes a
  movement that must be recorded in the accounting system.
- **Admin** — a KPI + resource-flow dashboard (revenue, pipeline, recurring
  revenue, crew workload, service mix).

## This is the Vercel-only MVP

There is **no backend yet**. All data lives in a local, `localStorage`-backed
store (`src/lib/store.ts`) seeded with realistic sample data. The store's
action surface is intentionally shaped like a database API so it can be swapped
for **Supabase** later with minimal churn in the UI. Deploys to Vercel
zero-config.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 (CSS-first theme in `src/app/globals.css`)
- Zustand (persisted) for state
- Framer Motion for high-feedback interactions
- Recharts for dashboard charts
- date-fns, lucide-react

## Develop

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

## Design system

- **Neuropsychological color coding** lives in `src/lib/colors.ts`: amber =
  needs action, blue = planned, cyan = active now, green = success/value,
  rose = closed, violet = recurring, slate = inactive. Crews get their own
  saturated palette shown as a stripe so they never fight the status pastels.
- Reusable primitives in `src/components/ui` (Button, Drawer, Modal, Toaster,
  sortable/filterable `DataTable`, StatCard, …). Every table view filters,
  sorts and is responsive; every page is mobile + desktop optimized.

## Map

```
src/lib/        types, store, seed, recurrence, selectors, colors, utils
src/components/ ui/ (primitives) · layout/ · calendar/ · quotes/ · clients/
                accounting/ · dashboard/ · teams/ · services/ · shared/
src/app/        dashboard · calendar · quotes · clients · accounting · teams
```

## Next steps toward production

1. Add Supabase: create tables mirroring `src/lib/types.ts`, replace the
   Zustand persist layer with Supabase queries behind the same action names.
2. Auth + role gating (coordinator / accountant / admin).
3. Real accounting integration for the digitization step.
