# Socrático

Repositorio de **socratico.do**. Next.js 16 (App Router, Turbopack), React 19 y Tailwind CSS v4, desplegado en Vercel.

## Desarrollo

```bash
npm install
npm run dev        # http://localhost:3000
```

```bash
npm run build      # build de producción (también typechecks)
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
```

## Estructura

- `src/lib/site.ts` — identidad del sitio (nombre, dominio, metadata).
- `src/app/layout.tsx` — fuente (Inter via `next/font`), metadata/SEO.
- `src/app/page.tsx` — página de inicio.
- `src/app/globals.css` — tokens de diseño en `@theme` (Tailwind v4).
- `src/app/robots.ts`, `src/app/sitemap.ts` — SEO.
