# Arquitectura — dónde vive cada cosa

Índice de la implementación: la capa de datos por fuente, las rutas de API, las
páginas y el contrato de rendimiento percibido. Se abre para responder **«¿dónde
vive X?»** y **«¿por qué está escrito así?»**; `CLAUDE.md` enlaza aquí y no
repite nada de esto.

Vivía dentro de `CLAUDE.md`, que se inyecta entero en cada turno: 211 líneas de
inventario de módulos que toda sesión pagaba para leer aunque fuera a tocar una
sola. Y por ser un listado a mano, se quedaba atrás en silencio — describía tres
de las seis funciones de `lib/format.ts` y no nombraba ninguna de las primitivas
compartidas. Aquí puede ser largo y exacto, porque solo lo abre quien lo
necesita.

## El stack y el alias de importación

Next.js 15 **App Router** + React 19 + TypeScript + Tailwind CSS 4. Imports use
the `@/*` alias resolving to the **repo root** (`app/`, `lib/`, `components/`) —
this project does **not** use a `src/` directory.

## Data layer — `lib/dgcp.ts` (the heart of the app)
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

## Fiscal data layer — `lib/fiscal.ts` + `lib/capitulos.ts`
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

## API routes — `app/api/*` (all `export const dynamic = "force-dynamic"`)
Thin proxies that call a `lib/dgcp.ts` function inside try/catch and return
`502` on upstream failure: `procesos` (search/list), `precios?subclase=`
(validates `subclase` against a digit regex), `unidades`, `proveedores?q=`
(the supplier lookup/market, same 30-min window as the page) and `feed` (renders
an **RSS 2.0** feed of the last 30 days for a saved search — the alerting
mechanism).
**The pattern for any new data capability: add a function in `lib/dgcp.ts`, then
a force-dynamic route here that wraps it.**

## Congreso data layer — `lib/congreso.ts`
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

## Senado data layer — `lib/senado.ts`
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

## Reading a bill — `lib/legislacion.ts`
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

## Reading documents — `lib/documentos.ts` + `components/visor-documento.tsx`
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

## Pages — `app/`
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

## Client state — `lib/seguimiento.ts`
Starred process codes in `localStorage` (key `lrd:seguimiento`). Cross-tab and
in-page updates propagate via a custom `lrd:seguimiento-cambio` event plus the
native `storage` event — subscribe with `onSeguimientoCambio`.

## Formato — `lib/format.ts`
Seis funciones, y el listado importa porque tres de ellas son obligatorias por
identidad, no opcionales:
- `formatMonto` — moneda es-DO por `Intl`.
- `formatFecha` — fecha absoluta. Un valor **sin offset** es una fecha de
  calendario dominicana y se muestra tal cual; solo un instante real con `Z` se
  convierte a `America/Santo_Domingo`. Convertir los primeros corría el día
  hacia atrás según la zona del servidor.
- `diasHasta` — días que faltan para una fecha; negativo si ya pasó.
- `hace` — antigüedad en llano («hace 4 meses», «ayer», «hoy»), contada en días
  de **calendario dominicano**, misma regla que `formatFecha`. En una fila de
  listado no se usa directamente sino a través de `components/antiguedad.tsx`.
- `formatPesos` y `formatMagnitud` — magnitud escrita, nunca abreviada: en uso
  dominicano «MM» se lee *millones*, así que abreviar mil millones así se
  equivoca por tres órdenes de magnitud en las cifras que más pesan.

## Primitivas compartidas — el sistema, en un sitio
La identidad se diluyó dos veces por la misma causa (`docs/IDENTIDAD.md` §8):
donde existe una primitiva la adopción es alta; donde no existe, la idea se
reimplementa en cada archivo. Estas son las que hay, y usarlas es la jugada
legal por defecto:

| Primitiva | Qué resuelve |
|---|---|
| `components/papel.tsx` | El vocabulario del papel: `Hoja`, `CabeceraHoja`, `Rotulo`, `Cifra`, `TiraDeCifras`, `Marca`, `Accion`. |
| `components/marca.tsx` | El contrasello: `Sello`, `SelloCompacto`, `Logotipo`. |
| `components/plegable.tsx` | Revelación progresiva; el botón dice **cuántos hay**, nunca «ver más». |
| `components/antiguedad.tsx` | La fecha de una fila de listado: `<time>` real, relativa a la vista, exacta en el `title`. |
| `components/esqueleto.tsx` | La silueta que se pinta mientras la fuente contesta, con las alturas del contenido. |
| `lib/estados.ts` | **La única** tabla de color de estado, nombrada por significado (`accionable`, `contexto`, `cumplido`, `aviso`, `anulado`). Cada fuente traduce a esos cinco y no guarda tabla propia. |
| `lib/cifras.ts` | Una cifra con su ancla y su alcance; prohíbe el `+∞ %`, la variación de un porcentaje en por ciento y el denominador sacado de una muestra. |
| `lib/glosario.ts` | La jerga traducida en el punto de uso, no en un glosario que nadie abre. |

## Rendimiento percibido — streaming y respuesta
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

