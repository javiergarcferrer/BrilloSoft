# Vista Verde

Marketing website for **Vista Verde**, a cleaning & maintenance company in the
Dominican Republic specializing in the careful treatment of delicate materials —
upholstery, curtains, carpets, furniture and wood — using professional Ecolab
products.

This is a redesign of the original Webflow site, rebuilt as a fast, static
Next.js app ready to deploy on Vercel.

## Stack

- **Next.js 16** (App Router, Turbopack) + **React 19**
- **Tailwind CSS v4** (design tokens in `src/app/globals.css` `@theme`)
- **framer-motion** for scroll reveals, **lucide-react** for icons
- **No backend** — every call-to-action is a WhatsApp, email or Instagram link

## Develop

```bash
npm install
npm run dev        # http://localhost:3000
```

Other scripts:

```bash
npm run build      # production build (also typechecks)
npm run lint       # ESLint
npx tsc --noEmit   # typecheck only
```

## Editing content

All business copy and data live in one file: **`src/lib/site.ts`**

- `SITE` — name, tagline, contact details (email, WhatsApp, Instagram), coverage
- `NAV_LINKS` — header / footer navigation
- `SERVICES` — the service cards
- `PROCESS` — the three-step process
- `CLIENTS` — client brands shown in the trust strip
- `STATS` — the figures in the "Nosotros" section

The page is composed in `src/app/page.tsx` from section components in
`src/components/sections/`.

## Adding real photography

The redesign is intentionally photo-free so it deploys immediately, using
gradients and typography. To add real photos:

1. Drop images in `public/` (e.g. `public/hero.jpg`).
2. Use `next/image` in the relevant section, e.g.
   `import Image from "next/image"` then `<Image src="/hero.jpg" … />`.

## Deploy to Vercel

Push the repo and import it in Vercel — the framework preset is pinned to
Next.js in `vercel.json`, so no extra configuration is needed. Set the custom
domain (`vistaverde.do`) in the Vercel dashboard.
