@AGENTS.md

# Socrático — project notes

Repository for **socratico.do**. Next.js 16 App Router, React 19, Tailwind v4,
deployed on Vercel.

## Commands

- `npm run dev` — dev server (Turbopack)
- `npm run build` — production build (also typechecks)
- `npm run lint` — ESLint
- `npm run typecheck` — `tsc --noEmit`

## Architecture

- `src/lib/site.ts` — site identity and metadata. Edit name/domain/copy here.
- `src/app/layout.tsx` — Inter via `next/font`, metadata/SEO, root shell.
- `src/app/page.tsx` — home page.
- `src/lib/utils.ts` — `cn()` (clsx + tailwind-merge).
- SEO files: `app/sitemap.ts`, `app/robots.ts`.

## Conventions

- Tailwind v4 with tokens in `globals.css` `@theme` (`brand` scale, `canvas`,
  `surface`, `ink`). **Keep class strings literal** so Tailwind's scanner emits
  them — no dynamic class construction.
- Copy is Spanish (es-DO).
