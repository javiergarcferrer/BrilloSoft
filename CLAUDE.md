@AGENTS.md

# Vista Verde — project notes

Marketing website for **Vista Verde**, a cleaning & maintenance company in the
Dominican Republic specializing in delicate materials (upholstery, curtains,
carpets, wood) using Ecolab products. **Static Vercel site, no backend** — all
CTAs are WhatsApp / email / Instagram links.

## Commands

- `npm run dev` — dev server (Turbopack)
- `npm run build` — production build (Turbopack; also typechecks)
- `npm run lint` — ESLint
- `npx tsc --noEmit` — typecheck only

## Architecture

- Next.js 16 App Router, React 19, Tailwind v4, framer-motion, lucide-react.
- `src/lib/site.ts` — **single source of truth** for copy, contact details,
  services, process steps, clients, stats. Edit content here.
- `src/app/layout.tsx` — fonts (Fraunces display + Inter sans via `next/font`),
  metadata/SEO, renders the header + footer around the page.
- `src/app/page.tsx` — composes the one-page site from `components/sections/*`.
- `src/components/sections/*` — Hero, Services, Process, Ecolab, Nosotros,
  Clients, Contacto. Server Components that wrap content in `<Reveal>`.
- `src/components/reveal.tsx` and `site-header.tsx` — the only Client
  Components (framer-motion / interactivity).
- `src/components/ui/*` — primitives (Button, Container, Logo, icon map).
- SEO files: `app/sitemap.ts`, `app/robots.ts`, `app/opengraph-image.tsx`,
  `app/icon.svg`.

## Conventions

- Tailwind v4 with tokens in `globals.css` `@theme` (forest/sage `brand` scale +
  cream surfaces). **Keep class strings literal** so Tailwind's scanner emits
  them — no dynamic class construction.
- Copy is Spanish (es-DO). Display serif headings, sans body.
- lucide-react 1.x dropped brand icons, so Instagram uses a local SVG glyph
  (`components/ui/instagram-glyph.tsx`).
