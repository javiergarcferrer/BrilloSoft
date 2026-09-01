# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**Socrático.do** — a Spanish-language (es-DO) intelligence platform over
Dominican state data. It covers three domains, each a thin cached front end over
a public source:

| Domain | Route | Source | Data layer |
|---|---|---|---|
| Compras públicas | `/licitaciones` | DGCP open-data API | `lib/dgcp.ts` |
| Congreso Nacional | `/congreso` | SIL Diputados + consultante del Senado | `lib/congreso.ts`, `lib/senado.ts` |
| Normativa del Ejecutivo | `/normativa` | Consultoría Jurídica (token + POST) | `lib/normativa.ts` |
| Nómina estatal | `/nomina` | Static payroll snapshot (11 institutions) | `lib/nomina.ts`, `lib/nomina-server.ts` |
| Deuda pública | card on `/` | Crédito Público XLSX (+ committed snapshot) | `lib/deuda.ts` |
| Democracia | `/democracia` | Supabase, schema `democracia` (the one exception) | `lib/democracia.ts`, `lib/supabase.ts` |

`lib/secciones.ts` is the single source of truth for verticals and navigation.

`/` is the **panorama**: live cross-domain indicators plus the signals that need
attention now (tenders closing this week, initiatives about to lapse).
`/fuentes` declares what feeds the platform, what is blocked and with which
coverage limits — keep it truthful when sources change.

**The intelligence platform has no database and no environment variables** —
all data is fetched live and cached via Next's fetch `revalidate`. Never
introduce a DB, API keys, or secrets **into the read-only intelligence
surfaces** (licitaciones, congreso, nómina, the panorama, /fuentes, and the
audit-driven additions like deuda and normativa). Those stay stateless.

**The one documented exception is the `/democracia` vertical** (citizen voting
on legislation), which by nature needs persistence and auth. It uses Supabase
(project `Transac`) confined to a `democracia` schema, and the app carries only
**publishable** keys (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
— the sensitive material (the cédula-hash pepper) lives inside Postgres, never
in the app env. See `PLAN-DEMOCRACIA.md`. Do not let this exception leak into
the stateless surfaces: no other vertical reads or writes the DB.

## Documents that govern a session

Only this file loads automatically. The others below are normative too; the
table says which one owns what and when a session must open it. The
`.claude/rules/*.md` files load by themselves when you touch matching paths
and condense the relevant document; they never replace it.

| Document | Owns | Open it when |
|---|---|---|
| `CLAUDE.md` | Architecture, invariants, commands, session protocol | Always (automatic) |
| `IDENTIDAD.md` | Visual system, voice, cognitive ergonomics. «If the UI contradicts it, the UI is wrong.» | Any change under `app/` or `components/` |
| `RECON.md` | Congress sources: verified mechanics of the SIL, the Senate consultante, document chains, field quirks, hygiene | Touching `lib/congreso.ts`, `lib/senado.ts`, `lib/legislacion.ts`, the fichas |
| `AUDITORIA.md` | Every other state source: status ✅/⚠️/❌, access families, architecture rules (§9, §E), integration plan (§D), blocks and their institutional unblock | Adding or changing a source; planning what to build next |
| `PLAN-DEMOCRACIA.md` | The database exception: schema, RLS, RPCs, security measures, what is out of v1 | Touching `democracia`, `supabase*`, `cedula`, `supabase/migrations` |
| `README.md` | Public description and feature list | Keep true when routes, features or stack change |
| `.claude/` | The harness: hooks (gate, guards), rules, skills, agents | Changing how sessions work; never to weaken a check |

## How a session operates

The owner runs this company alone and is not in the loop while you work.
Sessions must finish work, not hand back questions.

1. **Decide, record, proceed.** Routine judgment calls are yours; write the
   reasoning in the commit body. Ask only for what is irreversible or costs
   money: applying migrations to the live Supabase project, changing its Auth
   settings, adding credentials or dependencies that carry keys, deleting
   data, institutional requests. For those, prepare everything, list the
   exact steps, and stop.
2. **Verify before you claim.** A source "works" only after a real response
   with the identifiable User-Agent; a change is "done" only after
   `./.claude/hooks/verificar.sh --completo` prints `RESULT: clean`. Hooks run
   the fast gate after every TypeScript edit and before the session ends.
3. **Documentation is memory.** Whatever the next session would have to
   rediscover goes into the owning document above, in the ✅/⚠️/❌
   convention, and into `/fuentes` when it concerns a source. Chat is not
   memory.
4. **Deliver to `main`.** Every push to `main` deploys to production. Rebase
   on `origin/main` (other sessions push too), run the gate, push. Never
   force-push, never another branch, never `--no-verify`. `/entregar` is the
   checklist; commit messages are Spanish, imperative subject, prose body
   that explains why.
5. **Never weaken a check to pass it.** If a hook or the gate is wrong, leave
   it red and say so with evidence. The legal moves are: use the primitive,
   add the token, extract the sibling.
6. **Never evade a block.** WAF, challenge, 403/470, robots, CAPTCHA: the
   answer is institutional and is written down, not worked around. Never use
   a leaked credential.

Skills: `/verificar` (the gate), `/entregar` (docs → gate → commit → push),
`/nueva-fuente` (QRSPI for a state source). Agents: `recon` (field
reconnaissance with the platform's hygiene), `revisor` (read-only review
against every rule above).

## Open decisions (owner only — do not re-ask, do not decide)

- **Credentials for BCRD / Superintendencia de Bancos** (AUDITORIA §8.3):
  would be the first env var on a stateless surface. Until decided, macro
  comes only from the BCRD CDN files (§A.6) or not at all.
- **Dedicated Supabase project for /democracia in production**
  (PLAN-DEMOCRACIA §1): the pilot shares the `Transac` Auth pool.
- **Supabase Auth panel**: Site URL still `http://localhost:3000`, production
  domain not in the redirect allowlist, Magic Link template should send
  `{{ .Token }}`. Registration works without it (link paste path); fixing it
  is a panel action.
- **Institutional requests**: ONE whitelist, Cámara de Cuentas and 911 under
  Ley 200-04, JCE electoral archive, BCRD file index, report of the exposed
  311 token to OGTIC (AUDITORIA §A.9, §F).

Resolved, so nobody reopens them: XLSX parsing is done without a dependency
(`lib/deuda.ts` reads the ZIP directly); the Senate is read through its public
consultante, not its WordPress; PDFs are rasterized with pdf.js legacy on a
canvas through `/api/documento`.

## Commands

```bash
npm install
npm run dev      # dev server (http://localhost:3000)
npm run build    # production build — also runs the TypeScript typecheck
npm run start    # serve the production build
npx tsc --noEmit # typecheck only
```

There is no test suite and no ESLint config; `next build` is the gate, wrapped
by `./.claude/hooks/verificar.sh --completo` (typecheck, identity scan,
statelessness and secret scan, build). Deploys to Vercel automatically on push
to `main` (production: https://brillo-soft.vercel.app).
The lockfile pins **Next 15**; build against it (`npm ci`) — Turbopack on 16
tolerates things webpack on 15 rejects, such as `node:` imports reaching a
client bundle.

## Architecture

Next.js 15 **App Router** + React 19 + TypeScript + Tailwind CSS 4. Imports use
the `@/*` alias resolving to the **repo root** (`app/`, `lib/`, `components/`) —
this project does **not** use a `src/` directory.

### Data layer — `lib/dgcp.ts` (the heart of the app)
Owns all DGCP types (`Proceso`, `Articulo`, `Documento`, `Contrato`,
`ContratoArticulo`) and access functions:
- `dgcpFetch<T>(path, params, revalidate)` — single wrapper for every upstream
  call: 25s timeout, **one retry**, and normalizes the API's quirks (`hasError`
  flag, `payload.content` arriving as `null`).
- `listProcesos(opts)` — **passthrough/paginated** when there is no `q`; when `q`
  is present it scans up to `MAX_SEARCH_PAGES` (6) × 1000 records within the date
  filters and filters **server-side**, accent/case-insensitively (via
  `normalize`) across título/descripción/unidad_compra/código/área. Returns
  `scanned`/`truncated` so the UI can warn when the scan didn't cover everything.
- `getProceso(codigo)` — fetches process + artículos + documentos + contratos in
  parallel (each failure tolerated independently).
- `getUnidadesCompra()` — ~705 active buying units (cached 24h).
- `getPreciosSubclase(subclase)` — historical contracted unit-price stats
  (min/median/max + examples) by UNSPSC subclass (cached 1h).

Cache windows by data type: listings 5 min, precios 1 h, unidades 24 h.

### API routes — `app/api/*` (all `export const dynamic = "force-dynamic"`)
Thin proxies that call a `lib/dgcp.ts` function inside try/catch and return
`502` on upstream failure: `procesos` (search/list), `precios?subclase=`
(validates `subclase` against a digit regex), `unidades`, and `feed` (renders an
**RSS 2.0** feed of the last 30 days for a saved search — the alerting mechanism).
**The pattern for any new data capability: add a function in `lib/dgcp.ts`, then
a force-dynamic route here that wraps it.**

### Congreso data layer — `lib/congreso.ts`
Same contract as `lib/dgcp.ts`. The SIL is the portal's **internal** API, not a
documented public one, so three rules are enforced in `silFetch`:
1. **A `200` does not mean the route exists** — IIS serves the SPA shell (HTML,
   status 200) for unknown paths under `/sil/`, so `content-type` is validated
   on every response, never the status code.
2. **GET only.** The SIL's single write endpoint is never touched.
3. Identifiable User-Agent, 25s timeout, one retry, conservative concurrency.

It also owns legislature arithmetic (`evaluarPerencion`: 150-day terms opening
27 Feb and 16 Aug, 30-day warning window) and `muestrearIniciativas`, a bounded
sample — the SIL pages 10 at a time with no aggregates, so sweeping its ~622
pages per render is not viable. Views that use a sample must say so.

Field quirks worth keeping: `condicion` and `estado` are two coexisting
taxonomies; `numero` (`06225-2024-2028-CD`) is a **citation**, not a stable id,
because it carries the registration period; the reformulated title is buried
inside `descripcion` behind a `TÍTULO MODIFICADO:` marker. See `RECON.md` for
the full reconnaissance.

### Senado data layer — `lib/senado.ts`
The Senate has no JSON API: its WordPress REST API is locked (401) and the
corpus lives in the **public "consultante" mode** of its FileMaster at
`sil.senadord.gob.do` (ASP.NET WebForms, HTML scraping). Rules enforced there,
documented in `RECON.md` §12:
1. **Session per collection** — each cuatrienio (`C2002-2006`…`C2024-2028`) is
   a separate DB selected by `consultante.aspx`, which sets the ASP.NET session
   cookie; every cold read is a 2-request chain. Any redirect = failure
   (`redirect: "manual"` + one retry with a fresh session).
2. **Consultante only** — never `login.aspx` or admin paths. The single non-GET
   request is the search postback the public form itself uses (ViewState
   replay; `cmbOrden` must carry a value from its list or EventValidation
   500s).
3. Results are cached with `unstable_cache` (fetch-cache keys break on the
   session cookie and `_nc` nonce), windows 15 min/1 h — request volume stays
   far below the Senate WP's `Crawl-delay: 120` even though this host declares
   no robots.txt.

Source limits the UI must keep declaring: list = 50 most recent per collection
(no GET pagination) and search is a **literal accent-sensitive substring**.
Fichas *do* reach the project texts (RECON §13): `documentacionasociada.aspx`
answers by GET inside the session, and the chain
`documentoasociado.aspx` → 70-byte `.htm` → sibling PDF resolves to a file
nginx serves publicly and frameable — so the ficha embeds it. Those PDFs are
**scans with no text layer**, so no automatic synopsis is possible; say so
rather than implying the text is searchable. Senate
routes: `/congreso/senado` (list/search + `?c=` cuatrienio) and
`/congreso/senado/[cuatrienio]/[id]` (ficha). `parseNumeroSenado` treats
`01886-2026-SLO-SE` as a citation; identity is `IdExpediente` **per
collection**. The `TÍTULO MODIFICADO:` marker and PLO/SLO legislatura codes are
shared with Diputados (plus `SLE` extraordinarias, which have no fixed dates).

### Reading a bill — `lib/legislacion.ts`
Neither chamber publishes a synopsis, so this module explains instead of
summarizing, from the official wording only: `referenciasNormativas` pulls the
norms a title cites with their relation (deroga/modifica/adiciona…, taking the
**nearest** preceding verb so «deroga la Ley 189-11 y modifica el Decreto 95-12»
splits correctly), and `queEs`/`queSigue` translate instrument and procedural
condition into plain es-DO. `resolverNorma` in `lib/normativa.ts` turns each
citation into the official text at the Consultoría (its search accepts
`DocumentNumber` as the only filter). When a piece was
enacted, the dossier resolves its own promulgation number and links the law's
text — the only route to articulado on Diputados fichas, whose document server
is unreachable. Each chamber writes that number differently (Senate `136-15`,
Diputados `Ley núm. 43-26`), so `numeroDeNorma` normalizes before searching.
Rendered by `components/congreso/dossier.tsx`
on both chambers' fichas, above the vote widget — understand, read, then vote.

### Reading documents — `lib/documentos.ts` + `components/visor-documento.tsx`
One principle across every vertical: a page that names a document must let you
read it. `VisorDocumento` is the shared reader — never autoloads (some
expedientes are 30 MB scans), declares weight, and its *open* and *download*
links always point at the origin even when the iframe does not. Three cases the
sources impose:
- **Senate SIL** — serves PDFs public, `inline`, no `X-Frame-Options`: embedded
  straight from the origin, no proxy. They are scans (`escaneo` prop warns that
  the text is not searchable).
- **Consultoría** — `inline`, no CSP, and the PDFs are *digital text*: embedded
  directly, and each norm has its own page at `/normativa/[tipo]/[numero]`
  (`ley|decreto|reglamento|resolucion`), which the Congress dossier links to.
- **Every source goes through `/api/documento?url=`** — none of them sends
  CORS, and `components/lector-pdf.tsx` rasterizes with **pdf.js on a canvas**
  rather than an `<iframe>`, because an iframed PDF renders nothing on mobile
  (a grey box with an "Open" button that throws the reader out of the page).
  Canvas needs the bytes same-origin. That route is **not an open proxy**:
  only hosts in `ORIGENES_DOCUMENTO`, 40 MB cap, no visitor headers forwarded;
  it forwards `Range`, so the Senate's 30 MB scans stream page by page.
  Adding a host there is a deliberate decision. Use the **legacy** pdf.js
  build: the modern one calls V8 APIs (`Map.getOrInsertComputed`) that break
  chunked loading on browsers a couple of versions behind.

### Pages — `app/`
- `/` → panorama (server). `/licitaciones` → `app/buscador.tsx` (client) inside
  `<Suspense>`. Filters live entirely in
  the **URL** (`useSearchParams`) so any search is shareable/bookmarkable; it
  fetches `/api/procesos`. The `ESTADOS` and `MODALIDADES` enumerations are
  defined here and must match the DGCP vocabulary (default estado is
  `"Proceso publicado"`).
- `/procesos/[codigo]` → server detail page, with `precios.tsx` (client),
  `loading.tsx`, `not-found.tsx`.
- `/proveedores/[rpe]` → supplier profile.
- `/estadisticas` → 30-day market dashboard. `/guia` → static bidder guide.
- `/seguimiento` → starred processes.

### Client state — `lib/seguimiento.ts`
Starred process codes in `localStorage` (key `lrd:seguimiento`). Cross-tab and
in-page updates propagate via a custom `lrd:seguimiento-cambio` event plus the
native `storage` event — subscribe with `onSeguimientoCambio`.

### Formatting — `lib/format.ts`
`formatMonto` (Intl es-DO currency), `formatFecha` (fixed `America/Santo_Domingo`
timezone — keep dates deterministic), `diasHasta`.

## Identity — «El Contrasello»
The visual system lives in `app/globals.css` (`@theme` tokens) and is not
decoration: it is the vernacular of the Dominican official document turned to
the citizen's side. **Paper** (`canvas`, warm off-white — never screen white),
**ink** (`ink`), **seal** (`sello-*`, stamp red) and **signature**
(`brand-*`, ballpoint blue). Note the naming: `brand` is the *signature* —
links, buttons, active states, the working color — because it is what appears
most; `sello` is scarce by definition (the mark, «Deroga», the compras
vertical). If red is everywhere it stops meaning anything. `alerta-*` (ochre)
is a margin note, `valido-*` (archive green) is what is already fulfilled, and
`--color-v-*` are the per-vertical hues, used only for orientation.
Three faces, three jobs: Instrument Serif asks (h1/h2, `font-display`), Public
Sans explains (body/UI), IBM Plex Mono registers (amounts, codes, dossiers —
also the `.rotulo` small-caps epigraph). The mark is the contrasello: a «¿»
inside a seal, whose **dot is always seal red** — that is the one invariant
rule (`.punto-sello`), and it repeats in the `.do` of the wordmark. Never use
the national coat of arms or flag: this is independent, not official.
Voice: ask, don't accuse (headlines are questions); cite the source or say
nothing; plain es-DO before the technical term; always leave the whole
document alongside the explanation.

## Conventions
- All user-facing copy is Spanish (es-DO).
- This is an independent, unofficial tool — the footer and metadata say so; keep
  that framing.
- Tailwind v4 via the `@tailwindcss/postcss` plugin; tokens/utilities come from
  `app/globals.css`.
