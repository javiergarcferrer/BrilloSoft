@AGENTS.md

# Vista Verde — project notes

Public marketing website for **Vista Verde**, a cleaning & maintenance company
in the Dominican Republic (migrated off Webflow). Single-page, statically
rendered Next.js site on Vercel. **No backend** — the contact form composes a
pre-filled WhatsApp / email message.

## Commands

- `npm run dev` — dev server
- `npm run build` — production build (also typechecks + lints)
- `npx tsc --noEmit` — typecheck only

## Architecture

- `src/lib/site.ts` — **single source of truth** for all content: contact
  channels, services, process steps, value props, client list, nav. Edit copy
  here, not in the components.
- `src/lib/utils.ts` — `cn()` Tailwind-aware class combiner.
- `src/app/layout.tsx` — fonts (Fraunces + Inter via `next/font`), SEO
  metadata, JSON-LD `LocalBusiness`, `lang="es"`.
- `src/app/page.tsx` — composes the section components in order.
- `src/components/site/` — sections (`header`, `hero`, `services`, `process`,
  `why-us`, `eco`, `clients`, `contact`, `footer`) + primitives (`button`,
  `reveal`, `icons`, `brand-icons`, `logo`, `section-heading`).
- `src/app/globals.css` — Tailwind v4 `@theme` (forest `brand` scale, `sand`
  accent, surfaces) + motion. **Class strings must stay literal** so Tailwind's
  scanner emits them.

## Conventions

- Tailwind v4, theme in `globals.css`. No tailwind.config.
- Spanish (es-DO) copy throughout.
- Server components by default; `"use client"` only where needed (`header`
  mobile menu + scroll state, `reveal`, `contact` form).
- Keep everything responsive and accessible; respect `prefers-reduced-motion`.
- WhatsApp/email links go through `whatsappUrl()` / `mailtoUrl()` in `site.ts`.
