# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**Socrático.do** — a Spanish-language (es-DO) intelligence platform over
Dominican state data. It covers three domains, each a thin cached front end over
a public source:

| Domain | Route | Source | Data layer |
|---|---|---|---|
| Compras públicas | `/licitaciones` | DGCP open-data API | `lib/dgcp.ts` |
| Finanzas públicas | `/finanzas` | SIGEF open-data API (snapshot) | `lib/fiscal.ts`, `lib/capitulos.ts` |
| Congreso Nacional | `/congreso` | SIL Diputados + consultante del Senado | `lib/congreso.ts`, `lib/senado.ts` |
| Normativa del Ejecutivo | `/normativa` | Consultoría Jurídica (token + POST) | `lib/normativa.ts` |
| Nómina estatal | `/nomina` | Static payroll snapshot (11 institutions) | `lib/nomina.ts`, `lib/nomina-server.ts` |
| Deuda pública | card on `/` | Crédito Público XLSX (+ committed snapshot) | `lib/deuda.ts` |
| Democracia | `/democracia` | Supabase, schema `democracia` (the one exception) + Cuenta Única OIDC for verified identity | `lib/democracia.ts`, `lib/supabase.ts`, `app/democracia/cuenta-unica/` |

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
**publishable** keys (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
and `NEXT_PUBLIC_CUENTA_UNICA_CLIENT_ID`, the public OAuth client id for
Cuenta Única identity verification, empty until OGTIC issues it) — the
sensitive material (the cédula-hash pepper, the ID-token verification, the
service role) lives inside Postgres and a Supabase Edge Function, never in
the app env. See `docs/PLAN-DEMOCRACIA.md` (§9 for Cuenta Única). Do not let this exception leak into
the stateless surfaces: no other vertical reads or writes the DB.

## Documents that govern a session

Only this file loads automatically. The others below are normative too; the
table says which one owns what and when a session must open it. The
`.claude/rules/*.md` files load by themselves when you touch matching paths
and condense the relevant document; they never replace it.

| Document | Owns | Open it when |
|---|---|---|
| `CLAUDE.md` | Architecture, invariants, commands, session protocol | Always (automatic) |
| `docs/IDENTIDAD.md` | Visual system, voice, cognitive ergonomics. «If the UI contradicts it, the UI is wrong.» | Any change under `app/` or `components/` |
| `docs/RECON.md` | Congress sources: verified mechanics of the SIL, the Senate consultante, document chains, field quirks, hygiene | Touching `lib/congreso.ts`, `lib/senado.ts`, `lib/legislacion.ts`, the fichas |
| `docs/AUDITORIA.md` | Every other state source: status ✅/⚠️/❌, access families, architecture rules (§9, §E), integration plan (§D), blocks and their institutional unblock | Adding or changing a source; planning what to build next |
| `docs/PLAN-DEMOCRACIA.md` | The database exception: schema, RLS, RPCs, security measures, what is out of v1 | Touching `democracia`, `supabase*`, `cedula`, `supabase/migrations` |
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
- **Cuenta Única OAuth2 client** (PLAN-DEMOCRACIA §9, AUDITORIA §A.11):
  identity v2 for `/democracia` is **built and inert** (public PKCE client,
  verification inside the Edge Function `vincular-cuenta-unica`, subject
  hashed with the pepper). Cuenta Única has no dynamic client registration:
  the owner requests the `client_id` from OGTIC, applies migration
  `20260902120000`, deploys the function, and sets the id in Vercel and as a
  function secret (PLAN §9.5). Until then the UI does not offer the path.
- **Secret-scan scope** (`.claude/hooks/lib.sh`): the session that built
  Cuenta Única scoped the scan so key *values* are forbidden everywhere and
  the service-role *name* only on app surfaces, because the migration's GRANT
  and the Edge Function must name it. The reviewer flagged that a session
  changed the gate it had to pass. Ratify, or revert those three hook hunks
  and accept a red gate on `supabase/`.
- **Verified identity vs. declared cédula** (PLAN-DEMOCRACIA §9.5): when a
  Cuenta Única login confirms a cédula someone else typed unverified, the RPC
  refuses with `cedula_declarada_en_uso` and displaces nobody. Decide whether
  verification should win (deleting the unverified row and its votes).
- **Institutional requests**: ONE whitelist, Cámara de Cuentas and 911 under
  Ley 200-04, JCE electoral archive, BCRD file index, report of the exposed
  311 token and the Cuenta Única client request to OGTIC (AUDITORIA §A.9,
  §A.11, §F).

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

python3 scripts/build-fiscal.py   # regenera public/data/fiscal.json (SIGEF, ~5 min)
python3 scripts/build-nomina.py   # regenera public/data/nomina.json
python3 scripts/build-deuda.py    # regenera public/data/deuda.json
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

Four more endpoints of the same API, added after the second source audit
(`docs/AUDITORIA.md` §A.3) — same wrapper, same cache discipline:
- `getCompetencia(codigo)` — **`/ofertas`**: who bid on a process, not just who
  won. `proceso` filters upstream, so a process's bidders are the record, not a
  sample. Caveat the UI must keep stating: `estado_evaluacion` arrives empty
  even on awarded processes, so **the contracts say who won, never the offers**.
- `getProveedorRegistro(rpe)` — **`/proveedores`**: the supplier's registry
  card, including the RNC (the join key to DGII). The type deliberately drops
  the registry's phone/e-mail/contact fields: public by registry, but this is a
  watchdog, not a business directory.
- `getSubclase(subclase)` — **`/catalogo`**: plain-language UNSPSC names.
The supplier register is a **lookup, not a listing** (`docs/AUDITORIA.md` §A.12):
127,896 inscribed, ordered by `rpe` ascending, and only `rpe` and
`numero_documento` (9-digit RNC / 11-digit cédula, exact) actually filter —
`estado`/`provincia`/`region` are recognised names that 500 on every value, and
`razon_social`/`nombre`/`q` are silently ignored. Worse, **it cannot be swept**:
some pages return a permanent 500. So the layer offers:
- `getProveedorPorDocumento(doc)` — by RNC or cédula, digits normalised and
  retried zero-padded to 11 (the register stores cédulas that way).
- `contarProveedoresRegistrados()` — the census, the one figure here that may
  be a denominator.
- `registrosDeProveedores(rpes)` — registry cards in waves of 4.
- `muestrearProveedores()` — who is actually winning, aggregated **by RPE**
  over the same recent-contracts window `muestrearContratos` scans (both go
  through `paginasDeContratos`, so they share the fetch cache — keep the page
  count equal or the sharing breaks). It is a **sample**, never the census.
- `buscarProveedores(q)` — resolves a query by RPE, by document or by name; the
  name path can only search the window, and `ResultadoProveedores` carries the
  base (`contratosEscaneados`, `desde`/`hasta`) so the UI must declare it.
- `listPacc({periodo})` — **`/pacc`**: each unit's annual purchasing plan, the
  earliest signal the State publishes. Its `periodo` filter is ignored
  upstream, so the year is filtered server-side.

### Fiscal data layer — `lib/fiscal.ts` + `lib/capitulos.ts`
Budget execution per institution (vigente → comprometido → devengado → pagado),
month by month, from the **SIGEF open-data API** (`docs/AUDITORIA.md` §A.1). Three
things make it unlike the other layers:
1. **It reads a snapshot, not the network.** The API computes the running year
   live: ~97 s for a whole institutional section, 20–90 s for one institution —
   beyond any request budget. `scripts/build-fiscal.py` resolves the three
   sections in three calls into `public/data/fiscal.json`; the module serves it
   instantly and the UI always shows the cut date. Same contract as nómina.
2. **`PRESUPUESTO VIGENTE` is a monthly delta, not a balance** (month 1 = the
   year's opening, the rest = modifications with sign), so the real vigente is
   the year's **sum**. Getting this wrong yields a believable, false figure.
3. **The cut month is the last month with real accrual**, not the last month
   with rows: the source already returns zero-filled rows for the month in
   progress.
`lib/capitulos.ts` holds the 104 budget chapter codes (extracted from the
Transparency Portal's own form — Hacienda publishes the taxonomy nowhere else)
plus `titulizar`, which puts official ALL-CAPS names into reading case while
preserving the acronyms in parentheses.

### API routes — `app/api/*` (all `export const dynamic = "force-dynamic"`)
Thin proxies that call a `lib/dgcp.ts` function inside try/catch and return
`502` on upstream failure: `procesos` (search/list), `precios?subclase=`
(validates `subclase` against a digit regex), `unidades`, `proveedores?q=`
(the supplier lookup/market, same 30-min window as the page) and `feed` (renders
an **RSS 2.0** feed of the last 30 days for a saved search — the alerting
mechanism).
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
inside `descripcion` behind a `TÍTULO MODIFICADO:` marker. See `docs/RECON.md` for
the full reconnaissance.

### Senado data layer — `lib/senado.ts`
The Senate has no JSON API: its WordPress REST API is locked (401) and the
corpus lives in the **public "consultante" mode** of its FileMaster at
`sil.senadord.gob.do` (ASP.NET WebForms, HTML scraping). Rules enforced there,
documented in `docs/RECON.md` §12:
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
- `/proveedores` → «¿Quién le vende al Estado?»: the supplier index. Search
  lives in the **URL** (`?q=`) and the page states which of the two very
  different paths answered it — exact (RPE/RNC/cédula, over the whole register)
  or by name (only over the recent-contracts window). Below it, who wins most
  money and who wins most contracts, plus the registry cards of the ten biggest,
  streamed in their own `Suspense` because that panel costs one lookup per
  supplier.
- `/proveedores/[rpe]` → supplier profile: contract history plus the RPE
  registry card (RNC, legal form, incorporation date, MIPYME status).
- `/planes` → annual purchasing plans (PACC) for the current year.
- `/finanzas` → budget execution across the State, `/finanzas/[capitulo]` per
  institution (SSG from the snapshot, one page per chapter).
- `/estadisticas` → 30-day market dashboard. `/guia` → static bidder guide.
- `/seguimiento` → starred processes.

### Client state — `lib/seguimiento.ts`
Starred process codes in `localStorage` (key `lrd:seguimiento`). Cross-tab and
in-page updates propagate via a custom `lrd:seguimiento-cambio` event plus the
native `storage` event — subscribe with `onSeguimientoCambio`.

### Formatting — `lib/format.ts`
`formatMonto` (Intl es-DO currency), `formatFecha` (fixed `America/Santo_Domingo`
timezone — keep dates deterministic), `diasHasta`.

## Perceived performance — streaming and responsiveness
The sources are slow and outside our control, so the contract is that the
**page never waits for the slowest one**:
- **Every route has a `loading.tsx`** (`app/loading.tsx` is the generic
  silhouette; listings and fichas have their own) composed from
  `components/esqueleto.tsx`, with the content's heights and grids so nothing
  jumps when data lands. Navigation paints at once; content streams.
- **One `Suspense` per slow source.** The panorama renders the hero and
  structure immediately and each domain card / panel awaits only its own
  source. Listings (`/congreso`, `/congreso/senado`, `/normativa`) render
  header + search first and stream the rows. Fichas stream the dossier
  (Consultoría lookups), the Senate document chain and the `HEAD` for a PDF's
  weight after the ficha itself. Historical prices on `/procesos/[codigo]` are
  server components streamed per subclass, not client fetches after hydration.
- **`cache()` from React** wraps any read shared by `generateMetadata` and the
  page (`cargarProceso`, `cargarIniciativa`, `fichaPorClave`, `cargarNorma`)
  and by sibling sections (`procesosRecientes` on `/`), so a render issues one
  upstream request per datum. Anything the page can compute without the
  network (legislature dates, counts of a sample) stays outside the boundary.
- **Client lists keep the previous results on screen** while the next page
  loads (`aria-busy` + dimmed), never a skeleton swap; the skeleton is only
  for the first paint. `/licitaciones` renders a real silhouette as the
  `useSearchParams` fallback, never `null`.
- **Long lists paint lazily** with `.cv-auto` (`content-visibility: auto`;
  set `--cv-alto` to the row's height) on rows of procesos, iniciativas,
  expedientes, normas, capítulos and planes.
- **The edge caches the JSON routes**: every `app/api/*` success response
  carries `Cache-Control: public, s-maxage=<its lib window>,
  stale-while-revalidate`, matching the `revalidate` of the `lib/*` call it
  wraps. `public/data/*.json` snapshots carry one hour + SWR from
  `next.config.ts`, and `/nomina` `preload()`s its snapshot from the HTML.
- `next.config.ts` sets `experimental.staleTimes` (30 s dynamic / 5 min
  static) so returning to a visited listing does not wait for the SIL again.

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
