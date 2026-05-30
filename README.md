# Vista Verde

Public marketing website for **Vista Verde** — a cleaning & maintenance
company in the Dominican Republic ("Cuidamos tus espacios"). Built with
Next.js + Tailwind v4 and deployed on Vercel (migrated from Webflow).

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 (CSS-first theme in `src/app/globals.css`)
- `next/font` (Fraunces display + Inter body), `lucide-react` icons

## Develop

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build (typechecks + lints)
```

## Content

All copy and contact details live in **`src/lib/site.ts`** — services, process
steps, value props, client list, nav and the WhatsApp/email/Instagram
channels. There is **no backend**: the contact form composes a pre-filled
WhatsApp (or email) message, so the site deploys to Vercel zero-config.

## Structure

```
src/lib/             site.ts (content) · utils.ts (cn)
src/components/site/  header · hero · services · process · why-us · eco ·
                     clients · contact · footer  (+ button, reveal, icons,
                     brand-icons, logo, section-heading)
src/app/             layout.tsx · page.tsx · globals.css · icon.svg
```

## Design

- Elegant, eco-forward palette: forest **green** brand scale + warm **sand**
  accent over a soft canvas (`globals.css` `@theme`).
- Display serif (Fraunces) for headings, Inter for body.
- Scroll-reveal + subtle motion, with `prefers-reduced-motion` respected.
- Spanish (es-DO) throughout; SEO metadata + JSON-LD `LocalBusiness`.
