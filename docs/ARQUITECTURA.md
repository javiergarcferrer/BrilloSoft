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
  (The five plain-language **stages** of a process — `ETAPAS` / `etapaDe` /
  `etapaPorClave` — live in `lib/estados.ts`, not here: they are UI vocabulary
  and the client imports them, so keeping them out of this module keeps the
  adapter out of the browser bundle.)
- `listProcesos(opts)` — two paths, and the difference is declared in the
  response. **Passthrough** (one request, `totalResults` is the source's own
  census) when there is no `q`, no stage the API can't filter by itself, and
  `orden === "recientes"`. **Sweep** otherwise: up to `MAX_PAGINAS_BARRIDO`
  (6) × 1000 records within the given filters, then filtered **server-side** by
  stage and by text — accent/case-insensitively via `normalize`, across
  título/descripción/unidad_compra/código/área — then sorted and **really
  paginated**. It returns `scanned`/`truncated`/`muestra` so the UI must say the
  count came from a sample. A non-default sort forces the sweep on purpose:
  sorting is ranking, and ranking one page of 24 while the control says «Mayor
  monto» asserts something false about thousands of processes.
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

## Horizonte 3 snapshots — `lib/obras.ts` (y sus hermanas)
Sources too large to read per request (`docs/PLAN-ACCESO.md` §4), built by a
`scripts/build-*.py` into `public/data/*.json` and read from disk with
`node:fs` (server-only, like `lib/nomina-server.ts`), memoised per instance.
Every UI that shows them states the source's cut date.
- **`lib/obras.ts`** — MapaInversiones (`docs/AUDITORIA.md` §A.4).
  `scripts/build-obras.py` joins four open CSVs (~21 MB) by SNIP into
  `obras.json` (3,609 projects: estado, valor, avance, sector, entidad
  ejecutora, provincias, totals) and `obras-detalle.json` (top-12 contracts and
  processes per project), plus an index **proceso → SNIP** so
  `/procesos/[codigo]` finds the project even when the DGCP omits `codigo_snip`.
  `obrasDeProceso` returns each project with **who says so** (DGCP, MapaInversiones
  or both) because the two disagree. The executing entity is joined to the DGCP
  purchasing unit by normalised name plus the curated `EJECUTORAS` table.
  `AvanceFisico == AvanceFinanciero` in every row of the source, so the layer
  exposes one `avance` and the UI calls it «avance declarado».
  Self-contained server components for other pages live in
  `components/fuentes-nuevas/` (`ObraDelProceso`, `ObrasDeInstitucion`, `FilaObra`).
- **`lib/rnc.ts`** — DGII taxpayer register joined to the DGCP supplier register
  (`docs/AUDITORIA.md` §A.2, §A.12). `scripts/build-rnc.py` downloads the full
  supplier table (`/api-dgcp/v1/tablas/proveedores?Type=csv`, reading only RPE
  and document — contacts never leave the script) and the DGII ZIP (cp1252),
  keeps the 9-digit RNCs (legal persons) and writes ten shards
  `public/data/rnc/{0..9}.json` keyed by the RPE's last digit, each with its own
  dictionary of activities and states. `getRegistroTributario(rpe)` reads one
  shard; `FichaRnc` (in `/proveedores/[rpe]`) shows activity, state, regime and
  the days between «inicio de operaciones» and the oldest contract the API returns.
- **`lib/sismap.ts`** — MAP's SISMAP ranking (`docs/AUDITORIA.md` §A.7), three
  server-rendered tables (181 institutions, 160 ayuntamientos, 233 juntas) read
  by `scripts/build-sismap.py`, which also joins each row to a purchasing unit
  by normalised words (exact set, else Jaccard ≥ 0.85 with a unique best; an
  ayuntamiento never matches the junta of the same place; duplicate targets are
  dropped). No cut date is published upstream, so the snapshot carries
  `consultado`. `/gestion` shows the full ranking; `SismapDeInstitucion` the
  institution's row.
- **`lib/combustibles.ts`** and **`lib/tasa.ts`** are *live* sources, not
  snapshots (fetch `revalidate: 3600`, 25 s, one retry, content-type checked):
  the MICM front page (six prices + the week, parsed from its markup) and the
  BCRD reference-rate `.xlsx` on its CDN (daily sheet, only the tail parsed with
  `leerZip` exported from `lib/deuda.ts`). The panorama indicators live in
  `components/fuentes-nuevas/indicadores-bolsillo.tsx` (`SeccionBolsillo`).

## Tercera pasada — el Estado entero (`docs/AUDITORIA.md` §G)
Same two adapter classes, eight more sources.

⚠️ **Dev-only:** the first `next dev` render of `/` logs `RangeError: Maximum
call stack size exceeded` and truncates the stream; later renders pass. It
reproduces at `8eba621` (before this pass), and `next build` + `next start`
serve `/` at 200 (~230 KB). React 19's dev debug info serialises awaited
values and the panorama awaits large ones. Not yet fixed; verify pages with
a production build, not the first dev hit.

Snapshots (build-time `scripts/build-*.py` → `public/data/`, read with
`node:fs`, memoised; UI states the generation date):
- **`lib/historico.ts`** — every DGCP contract and process since 2015
  (§G.1). `scripts/build-historico.py` downloads the two bulk tables
  (~360 MB), assigns a contract to its purchasing unit by the unambiguous
  prefix of its code (99.2 %), sums DOP, non-cancelled contracts and **sets
  aside** every contract ≥ RD$10 000 millones (listed, never summed). Writes
  `historico/resumen.json`, `historico/instituciones.json` and ten
  `historico/proveedores/{d}.json` shards by the RPE's last digit. Pages:
  `/historico`; blocks `HistoriaDeInstitucion` / `HistoriaDeProveedor`
  (`components/fuentes-nuevas/historia-compras.tsx`) on both fichas. The bar
  chart is `components/barras.tsx` (extracted from `/deuda`, now with `tono`).
- **`lib/biblioteca.ts`** — documents published by 22 institutions through
  WordPress' public `/wp-json/wp/v2/media` (§G.2). `scripts/build-documentos.py`
  checks robots per host, walks every page up to `X-WP-TotalPages` (empty pages
  in the middle are normal), 1 s per host, hosts in parallel; keeps title,
  upload date, type and the original URL (nothing is rehosted). `/documentos`
  searches titles and file names (all words, no accents);
  `DocumentosDeInstitucion` shows the latest on the institution ficha.
- **`lib/nomina-general.ts`** — MAP's statewide payroll (§G.10), 492k rows
  aggregated by `scripts/build-nomina-general.py` into institution → cargo
  stats without names or gender; served server-side by `/nomina/general`
  (never shipped whole to the browser, unlike `nomina.json`) and used as the
  nómina block of fichas that have no payroll of their own.
- **`lib/bcrd.ts`** — BCRD IPC and air arrivals from BIFF `.xls` files
  (§G.5), converted by `scripts/build-bcrd.py` (build-time `xlrd`), card
  `InflacionTurismo` on `/`.
- **`lib/subsidio.ts`** — Treasury transfers to the state electricity
  companies since 2019 from SIGEF `gastos/transferencias` (§G.8),
  `scripts/build-subsidio.py`; card on `/finanzas`.
- **`lib/catalogo.ts`** — the whole datos.gob.do catalogue (§G.3) from its HTML
  search, 10 s between requests (`scripts/build-catalogo.py`). `/datos`.

Live sources (fetch `revalidate`, 25 s, one retry, content-type checked, each
card degrades alone to «no contestó»; cards in `components/fuentes-nuevas/`,
composed in `app/page.tsx`):
- **`lib/macro.ts`** — BCRD CDN remittances, gross reserves, weighted lending
  rate (§G.5), `IndicadoresMacro`. Daily.
- **`lib/aduanas.ts`** — Aduanas' JSON document index → import/export/revenue
  XLSX (§G.5), `ComercioExterior`. Daily.
- **`lib/energia.ts`** — Organismo Coordinador hourly generation and marginal
  plant for yesterday (§G.8), `DiaElectrico`. Hourly.
- **`lib/sociedad.ts`** — MIP robberies and firearms, MINERD enrolment,
  MIVHED permits (§G.14), snapshot from `scripts/build-sociedad.py` (each block
  validated alone, a failed block keeps the previous one marked `heredadoDe`);
  `/pais`.
- **`lib/auditorias.ts`** — Contraloría and Cámara de Cuentas audit reports
  plus the sworn-declaration lists as titled links, no names (§G.12);
  snapshot from `scripts/build-auditorias.py`; `/auditorias`.
- **`lib/banca.ts`** — SIMBAD chart data (`type=results`, never the query)
  for four banking series (§G.13), `IndicadoresBanca` on `/`. Daily.
- **`lib/subastas.ts`** — Crédito Público auction results (§G.13), snapshot
  from `scripts/build-subastas.py` (build-time `xlrd` for 2025), `SubastasDeuda`
  on `/deuda`.
- **`lib/cortes.ts`** — scheduled maintenance outages from Edenorte's RSS and
  Edesur's weekly page (§G.11), today onward; `/luz`.
- **`lib/alertas.ts`** — INDOMET CAP feed (§G.4), `AlertasTiempo`. 15 min.
- **`lib/siniestralidad.ts`** — OPSEVI's undocumented JSON (§G.7),
  `SiniestralidadVial`; current year vs the same months of the previous one.
- **`lib/tse.ts`** — Tribunal Superior Electoral rulings (§G.6), same shape
  as `lib/tc.ts` (unstable_cache over parsed rows; follows «Siguiente», 15
  pages max, `truncado` declared); `/tse`.
- **`lib/justicia.ts`** — Poder Judicial monthly entradas/salidas by
  departamento (§G.6), snapshot from `scripts/build-justicia.py`, card
  `EstadisticasJudiciales` on `/`.
- **`lib/tc.ts`** — Tribunal Constitucional rulings, one year per read (§G.6);
  `/constitucional`. The exception in this list: a year is up to ~1.1 MB of
  HTML, near the 2 MB fetch-cache limit, so it fetches `no-store` inside
  `unstable_cache` over the parsed rows (6 h current year, 7 d closed years)
  with a 60 s timeout (a year measured 7.7 s).

## API routes — `app/api/*` (all `export const dynamic = "force-dynamic"`)
Thin proxies that call a `lib/dgcp.ts` function inside try/catch and return
`502` on upstream failure: `procesos` (search/list; `procesos/csv` the whole
sweep, both parse filters with `procesos/filtros.ts`), `precios?subclase=`
(validates `subclase` against a digit regex), `unidades`, `proveedores?q=`
(the supplier lookup/market, same 30-min window as the page) and `feed` (renders
an **RSS 2.0** feed of the last 30 days for a saved search — the alerting
mechanism).
**The pattern for any new data capability: add a function in `lib/dgcp.ts`, then
a force-dynamic route here that wraps it.**
Two routes serve the follow feature without storing anything: `seguimiento`
(`?tipo=proyecto&id=` or `?tipo=expediente-senado&id=<cuatrienio>/<id>`) wraps
`getIniciativa`/`getFichaSenado` and returns only `{huella, titulo}` — the
existing `congreso`/`senado` routes are listings and cannot return one piece —
and `feed/congreso/[id]` renders a bill's SIL history as RSS. Processes are
read through `procesos?proceso=`; an institution's new processes are already
`feed?uc=`.

`buscar?q=&n=&tipo=` wraps `buscarEnTodo` (`lib/busqueda.ts`) for the palette:
the first `n` rows of any type, at most half from one type when no `tipo` is
given.

## Búsqueda — `lib/busqueda.ts` + `public/data/busqueda/`
El índice de toda la plataforma, sin base de datos ni clave: cuatro archivos
versionados y dos bibliotecas abiertas.

- **Corpus** (`corpus.json`, ~10.9 MB): 67,906 entradas de siete instantáneas
  —instituciones, normativa, obras, documentos, datos abiertos, cargos de
  nómina (las grafías de un mismo cargo se juntan) y proveedores—, con
  título, texto auxiliar, quién publica (tabla `origenes`), enlace y fecha.
  Lo escribe `scripts/build-busqueda.py`, que se corre **después** de
  regenerar cualquiera de ellas, y lleva una `huella` (sha256 de las
  entradas) que ata a él el índice guardado.
- **Proveedores** (32,152): los que tienen al menos un contrato desde 2015 en
  `public/data/historico/proveedores/` —no los ~138 mil inscritos del RPE,
  casi todos sin contrato ni ficha que enseñar—, con el RNC del cruce con la
  DGII (`public/data/rnc/`) cuando existe; ni teléfono ni correo, que ninguna
  instantánea guarda. Llevan RPE (`r`), RNC (`c`), contratos (`k`) y años
  (`a`); enlace y detalle («RNC … · 865 contratos, 2015–2026») los deriva
  `aResultado`. **Sin vector**: un nombre de empresa no dice de qué trata, y
  32 mil filas serían ~4 MB para acercar razones sociales por su sonido. Van
  al final del corpus; `vectorizados` (35,754) dice hasta dónde hay vector.
- **Por palabra**: Orama (`@orama/orama`, Apache-2.0), un BM25 sobre título
  (×3), texto auxiliar y origen. Esquema y tokenizador viven en
  `lib/busqueda-esquema.ts`, sin alias `@/`, para que el servidor y
  `scripts/build-indice-busqueda.mjs` (que `node` carga quitando tipos) usen
  el mismo: si discreparan, las raíces guardadas no serían las de la
  consulta. Sin índice de orden (`sort: { enabled: false }`): nadie ordena
  por campo.
- **Índice guardado** (`indice.json.br`, 2.8 MB): `save()` de Orama tras
  construirlo en build, sin la copia de los documentos (el servidor solo usa
  el id) y en JSON con brotli; el script comprueba que 14 consultas, con y sin
  tipo y errata, den los mismos ids y puntuaciones que el índice recién
  construido, y si no, falla. La primera línea es la etiqueta del corpus
  (fecha | huella | entradas): si no coincide —se regeneró el corpus y no
  esto—, o el archivo falta o no se lee, el servidor lo construye en memoria,
  más lento y nunca distinto. `@orama/plugin-data-persistence` se midió y no
  se usa: su `restore` crea una base con esquema de relleno y el tokenizador
  por defecto (se perdería el lematizador español), `dpack` y `seqproto`
  fallan a este tamaño (seqproto pasa de 16 MB), y su `binary` es msgpack en
  hexadecimal (50.7 MB, y decodificar msgpack cargaba en ~2 s contra ~0.65 s
  de `JSON.parse`).
  `lib/raiz.ts` le da el lematizador español (`@orama/stemmers`) **después
  de quitar tildes** —al revés, «Educación» daba `educ` y «educacion»
  `educacion`— y la lista de palabras vacías de `@orama/stopwords` **menos
  las de contenido** que trae (trabajo, estado, empleo, general, poder,
  cuenta, trata, valor…): con ellas, «ministerio trabajo» era «ministerio».
  Todas las palabras tienen que estar, **en cualquier campo**: el
  `threshold: 0` de Orama lo exige dentro de un mismo campo, así que se
  busca cada palabra, se cruzan los conjuntos y se ordena por el BM25 de la
  consulta entera. Con un tipo elegido, la búsqueda se hace dentro del tipo
  (`where`), para que la lista llegue tan lejos como su cuenta. Una errata
  se perdona solo si lo exacto no trajo nada y la consulta es de una o dos
  palabras de seis letras o más: la tolerancia actúa sobre la raíz, y «agua»
  (`agu`) a distancia uno es `agr`.
- **Por tema**: Model2Vec `potion-multilingual-128M` (MIT), un embedding
  **estático** —una tabla por pieza, sin red que ejecutar—, podado al español
  por `scripts/build-modelo-semantico.py` (72,837 piezas, PCA 256→128, int8:
  `modelo.bin` 9.6 MB + `tokenizer.json` 2.7 MB). La consulta se tokeniza con
  `@huggingface/tokenizers` (JS, Apache-2.0; mismos ids que el de Rust,
  verificado en 6,000 títulos) y se promedia; se compara por coseno contra
  `vectores.bin` (4.7 MB). Umbral 0.55: por debajo, el parecido es ruido.
- **Fusión**: rango recíproco (RRF, k = 60; el tema pesa 0.6), un bono al
  nombre o a las siglas exactas, y un peso menor para hospitales,
  ayuntamientos y cargos. Solo se juntan copias de verdad: el **mismo
  archivo** (URL sin extensión) en PDF y XLSX es una fila con dos formatos;
  dos decretos «Que otorga exequátur» o dos obras homónimas con distinto
  SNIP son filas distintas. Cada resultado dice su vía: `palabra`, `tema` o `ambas`; la
  interfaz marca «Por tema» lo que no lleva todas las palabras.
- **Coste**: primera consulta de una instancia ~1.2–1.5 s con el índice
  guardado, contra ~4.5 s construyéndolo (68 mil entradas; con las 36 mil de
  antes eran ~2.4 s), medido con `next start` el 2026-09-26; 15–150 ms por
  consulta en caliente. `/buscar` pone los resultados en un
  `Suspense` para que la caja no espere; la paleta no muestra nada mientras
  tanto (y «Toda la plataforma» sigue ahí), y si `/api/buscar` falla lo dice
  en una línea: «no respondió» no es «no hay nada». `next.config.ts` declara los
  archivos en `outputFileTracingIncludes` de las dos rutas que los leen.
- ⚠️ **Límite del tema**: un embedding estático entiende vecindad de
  palabras («agua potable» ↔ «acueducto», «escuelas» ↔ «educación»), no
  frases: «corrupción» no llega a «Cámara de Cuentas». Por eso acompaña a la
  palabra y nunca la sustituye. Un modelo de frases (`multilingual-e5-small`)
  se evaluó y no se adoptó: mejor en 7 de 17 consultas, peor en 5, ~220 MB
  más en la función y ~2 s más en frío (`docs/PLAN-ACCESO.md` §6 bis).

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
  Since 2026-09 Cloudflare challenges Vercel's egress to the Consultoría, so
  listings and citations fall back to `public/data/normativa.json` and the
  proxy cannot fetch the PDF; «Abrir en el origen» is the path (AUDITORIA §4.1).
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
  fetches `/api/procesos`. `MODALIDADES` is defined here and must match the
  DGCP vocabulary. **State is filtered by *etapa*, not by `estado_proceso`**:
  `ETAPAS` in `lib/estados.ts` groups the source's seven states into five
  plain-language stages (`abiertos`, `cerrados`, `evaluacion`, `adjudicados`,
  `sin_efecto`) so «what already closed» is one option instead of six literals
  the reader has to know. Each stage is a **predicate over the normalised
  state**, never a list of literals — an unrecognised state falls into
  `cerrados` (defined by negation of `abiertos`) instead of vanishing.
  The URL carries `?etapa=`; `?etapa=` present-and-empty means *every* stage
  and is not the same as absent, which is the default `abiertos`. Legacy
  `?estado=<literal>` links and saved searches are translated through
  `etapaDe()`. Only `abiertos` maps to a single upstream value
  (`estado=Proceso publicado`), so it stays a one-request passthrough; the
  other stages, free-text search, and any sort other than «recientes» go
  through the bounded sweep and therefore return `scanned`/`truncated`/
  `muestra` for the UI to declare.
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
- `/finanzas` → budget execution across the State. Filtered on the server
  from the URL (`?q=`, `?seccion=`, `?orden=devengado|ejecucion|cambio|pendiente`),
  so it is dynamic; three rankings computed from the same snapshot columns
  (`vigente − inicial`, `devengado − pagado`, lowest execution among chapters
  over RD$ 1,000 millones, zero-accrual ones named apart), and a CSV of the
  filtered table built in the browser (`app/finanzas/descargar-csv.tsx`).
  `/finanzas/[capitulo]` per institution (SSG from the snapshot, one page per
  chapter) lists its DGCP purchasing units from `institucionesDelCapitulo`,
  each linking to its `/instituciones/[id]` ficha.
- `/deuda` → SPNF debt over time (finanzas section): year-end since 2000 with
  % of GDP and quarter-ends since 2015 from `getSerieDeuda()` (`lib/deuda.ts`),
  which reads the series from `public/data/deuda.json` and appends the live
  latest close when Crédito Público answers. Bars are a server SVG
  (`app/deuda/barras.tsx`) with a table behind a `Plegable`.
- `/nomina` → the payroll explorer (client, `components/nomina/explorer.tsx`)
  keeps its state in the URL: `?q=` and `?inst=CODIGO` are a contract with the
  ⌘K palette and the institution ficha; `?cargo=` (normalized prefix match,
  `patronCargo` in `lib/nomina.ts`) and `?vista=resumen|tabla|comparar` are its
  own. Written with `history.replaceState`, applied back when a link changes
  the URL. The page resolves the code → ficha links on the server (the
  institutions cross is 114 KB and never ships to the client) and lists the
  covered institutions with an ochre mark when a photo is older than three
  months (`estaAtrasada`); `revalidate` is a day so that mark stays true.
- `/congreso/legisladores` → directory of the 2024-2028 period (189 deputies
  and the 32 senators the SIL also lists), read **whole** from the SIL — one
  listing per demarcation (`nivel=` is the province id, not the level; RECON
  §14), ~41 requests cached a day — and filtered in the page by `?q=` (name,
  accent-insensitive), `?camara=`, `?partido=` and `?provincia=`. The province
  is compared through `claveProvincia` (accents, spacing, «Monte Cristi»,
  «Concepción de La Vega»…), because `/provincias` links with common names.
  `/congreso/legisladores/[id]` → what they signed (`getPropuestasDeLegislador`,
  bounded to 20 pages and declared as a sample past that), how much was
  approved (condition → tone, `?ver=` cuts), and for deputies how they voted in
  the 30 latest votes of the legislature (`getVotosDeLegislador`, filtered by
  session code). `/congreso/votaciones/[id]` → one plenary vote with the
  roll call of all 190 (19 pages, cached a day), by party and by name.
  `/congreso/[id]` links each deputy/senator sponsor to their ficha and lists
  the plenary votes of the bill.
- **Cross-links** (`components/congreso/cruces.tsx`, each in its own
  `Suspense`, silent when unconfirmed): Diputados ↔ Senado via the Senate's
  «Número de Expediente Cámara Diputados» or, when empty, the shared
  promulgation number (`gemeloEnSenado` in `lib/senado.ts`, at most one
  search + three fichas, only for bills that can be in the Senate); and
  `/normativa/ley/[numero]` → the Diputados bill that became that law plus
  bills citing it (`proyectosDeNorma` in `lib/legislacion.ts`: title phrase +
  confirmation by `numPromulgacion`, since the SIL does not search that field).
- `/estadisticas` → 30-day market dashboard.
- Guides, one per vertical, all static and listed once in
  `components/otras-guias.tsx`: `/guia` (bidding, under Licitaciones),
  `/congreso/guia` (how a law is made), `/finanzas/guia` (reading the budget),
  `/finanzas/guia/deuda` (public debt). They live under their vertical so the
  section bar lights the right one; `/guia` keeps its old URL.
- `/seguimiento` → platform page (not a vertical; «El Estado › La plataforma» in `lib/menu.ts`):
  everything followed, grouped by type, and «qué cambió desde tu última
  visita».
- **Every purchasing unit links to its institution** (`/instituciones/[id]`,
  `lib/instituciones.ts`): the process ficha, `/contratos` and `/estadisticas`
  rankings (aggregated by `codigo_unidad_compra`, not by name), each PACC row,
  a supplier's main clients (by the code the contract carries) and
  `/licitaciones?uc=`. The cross is 114 KB, so client components never import
  it: `/api/unidades` adds `ficha` to each unit server-side for the buscador.
- **CSV downloads** (`lib/csv.ts`: BOM, CRLF, formula-injection guard, scope in
  the filename and `X-Alcance`): `/api/procesos/csv` is the **whole sweep** of
  a `/licitaciones` search (`descargarProcesos`, same filters via
  `app/api/procesos/filtros.ts`, capped at `MAX_FILAS_DESCARGA` = 6000 rows
  read); `/contratos/csv` the 6000-contract sample (`contratosRecientes`,
  same fetch cache); `/normativa/csv` the current list without the 200-row cut.
- `/normativa?q=&mes=&materia=` → text search over number + title (all words, accent-
  insensitive; not the norm's body) of the chosen type and year, live or
  snapshot like the listing (`listaNormativa`). With decretos it shows
  «Designaciones del mes» (`designacionesPorMes`): decrees tagged «Cámara de
  Cuentas» by the Consultoría (appointments and their revocations), per month,
  cargo read from the first mention in the title — derived, and declared so.
  Decretos also get a subject (`materiaDe`: ordered rules over the plain
  title and the source's `Institucion` tag, first match wins; the «Cámara de
  Cuentas» tag only decides an appointment last, because the source also puts
  it on emergency and errata decrees; «Otros asuntos» ~5 % of 2023–2026). The «¿De qué tratan…?» card counts the whole year and
  each subject links to `?materia=`; rows and the CSV (`materia_derivada`)
  carry it. Rules, not a model: they run on the live read with no key
  (docs/DECISIONES.md, Jev).
- `/provincias`, `/provincias/[slug]` (`lib/provincias.ts`) → 32 demarcations.
  The supplier register cannot be filtered by `provincia` (500 with any value,
  re-verified 2026-09-23), so suppliers per province = registry cards of the
  200 biggest winners of the contracts window, grouped by their declared
  province (`unstable_cache`, daily, one computation for all pages). Local
  governments: only the capital's ayuntamiento (and Santo Domingo's seven
  municipalities), hand-mapped by DGCP code. Legislators: link to
  `/congreso/legisladores?provincia=<SIL name>`.
- `/obras` → «¿Existe la obra y avanza?»: the investment snapshot, filtered
  server-side by `?q=`, `?estado=`, `?provincia=` (slug) and `?uc=` (purchasing
  unit); `/obras/[snip]` → one project with its contracts and processes, linked
  to `/procesos/*` and `/proveedores/*`.
- `/gestion` → SISMAP ranking, `?tabla=instituciones|ayuntamientos|juntas` and `?q=`.

## Chrome and indexing — `lib/menu.ts`, `app/sitemap.ts`, `lib/sitio.ts`
- **Megamenú** (`components/megamenu.tsx` over `components/ui/navigation-menu.tsx`,
  Radix NavigationMenu): three doors — Dinero público, Leyes, El Estado — whose
  panels list every destination with a one-line `nota` from `lib/menu.ts`, plus
  a featured entry per door. The viewport is anchored to the sticky header
  (`absolute inset-x-0 top-full`), so the panel is as wide as the page column.
  The trigger holding the current route gets a paper underline (`grupoActivo`).
  The phone's «Más» sheet renders the same `MENU`. No questions in the header
  (owner decision, DECISIONES): `pregunta` survives only as a palette keyword.
- **The index** (`lib/indice.ts`, taxonomy in `lib/tareas.ts`): every
  destination once, derived from `MENU`, where each link declares its `tarea`
  (vigilar · buscar · comparar · leer · participar · entender). The palette
  groups by task, `app/sitemap.ts` lists it, and `.claude/hooks/indice.py`
  fails the gate on a static page that is neither in the menu nor in
  `FUERA_DEL_INDICE` with its reason. It replaced `PAGINAS_PLATAFORMA`: three
  lists of destinations had drifted apart (the palette did not know `/pais`
  or `/luz`).
- **Indexing:** `metadataBase` = `SITIO` (`lib/sitio.ts`, a constant — no env).
  Every page declares `alternates.canonical`: static pages their route, fichas
  their own path (`/instituciones/237` → `/instituciones/237-minerd`). Not
  indexed: `/buscar` (results) and `/seguimiento` (lives in `localStorage`),
  plus the /democracia registration flows. `app/sitemap.ts` (daily) lists the
  views, platform pages, 739 institutions, 32 provinces, ~3,600 obras, the
  budget chapters, the norms of the normativa snapshot (~3,000) and the 221
  legislators; processes, bills and suppliers are reached through links.

## Client state — `lib/seguimiento.ts`
Followed items in `localStorage` (key `lrd:seguimiento`) as typed entries
`{tipo, id, titulo, href, huella?, desde?, visto?}`, `tipo` ∈ proceso, proyecto,
expediente-senado, proveedor, institucion, norma. The old shape (a bare array of
process codes) is migrated on read. `huella` is the state in words, computed by
`huellaDe()` — the same function on the ficha (when following, through
`components/acciones-ficha.tsx`) and in `/api/seguimiento`, so they cannot
drift. `/seguimiento` fetches today's state for the types in `TIPOS_CON_ESTADO`,
shows before/after for those whose huella changed, and only then writes the new
huella (`marcarVistos`). Cross-tab and in-page updates propagate via a custom
`lrd:seguimiento-cambio` event plus the native `storage` event — subscribe with
`onSeguimientoCambio`. `getSeguimiento`/`toggleSeguimiento` keep the old
process-code API for `proceso-card` and `section-bar`. Push notifications are
an open owner decision (`docs/PLAN-ACCESO.md` §6): not built.

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

### La capa de abajo: `components/ui/*` (shadcn/ui)
Las piezas genéricas —superficie, botón, marca, campo, pestañas, hoja modal,
desplegable, tabla, medidor— son **shadcn/ui**: código en el repositorio, no una
dependencia de componentes, con Radix por debajo, `cva` para las variantes y
`tailwind-merge` dentro de `cn` para que el sitio de uso pueda ajustar una clase
sin pelearse con la base.

No entraron por aspecto —ese ya lo teníamos— sino por lo que cuesta hacer bien a
mano y casi nadie hace: **foco atrapado dentro de una hoja modal, recorrido con
flechas, cierre con Escape y devolución del foco al disparador**. La hoja de
filtros del buscador tenía las cuatro cosas mal.

Ninguna decisión de color de la librería sobrevive. El puente de tokens al final
de `@theme` en `app/globals.css` ata el vocabulario semántico de shadcn
(`bg-background`, `text-muted-foreground`, `border-border`, `bg-primary`) a los
tokens de «El Contrasello»: `background` **es** `canvas`, `primary` **es** la
firma, `destructive` **es** el sello. Cambiar el papel se sigue haciendo en
`--color-canvas` y las cuarenta primitivas lo siguen.

Tres desviaciones deliberadas respecto a shadcn, todas escritas en la cabecera
del archivo que las lleva:
- **`Card` no flota**: sin `shadow-sm` y con `rounded-lg`, porque el papel se
  separa con filete (§2 y §3 de la identidad). La sombra queda para lo que de
  verdad se superpone: `dialog`, `sheet`, `popover`, `dropdown-menu`, `tooltip`.
- **`Progress` no usa Radix**: es un componente de servidor. Esta plataforma
  dibuja barras sobre todo en el servidor —veinte adjudicatarios, veintitantos
  capítulos— y lo único que Radix aportaba eran cuatro atributos ARIA.
- **Los iconos salen de `components/icons.tsx`**, no de `lucide-react`.

### La capa de arriba: lo que ninguna librería puede traer
| Primitiva | Qué resuelve |
|---|---|
| `components/papel.tsx` | Lo que es doctrina y no aspecto: `Rotulo` (su punto es el sello), `Cifra` (un número **con su ancla**) y `TiraDeCifras`. `Hoja`, `CabeceraHoja`, `Marca` y `Accion` ya no existen: son `Card`, `CardHeader`, `Badge` y `Button`. |
| `components/portada.tsx` | La banda de tinta con la pregunta, y su tira de cifras. Estaba copiada en siete páginas. |
| `components/estado-vacio.tsx` | «No hay nada» y «no pudimos mirar», que no se pueden confundir: `variante="caida"` obliga a decir qué pasó, qué sigue en pie y cuál es la única acción útil. |
| `components/marca-estado.tsx` | La marca de estado de un expediente, sea de la fuente que sea, sobre `lib/estados.ts`. Estaba escrita tres veces. |
| `components/campo-busqueda.tsx` | El campo de búsqueda con su **alcance dicho debajo**, antes del toque y no después de «sin resultados». |
| `components/nav-filtros.tsx` | La fila de filtros que **son enlaces** (tipo, año, cuatrienio): cada uno es una página que se comparte. |
| `components/marca.tsx` | El contrasello: `Sello`, `SelloCompacto`, `Logotipo`. |
| `components/plegable.tsx` | Revelación progresiva sobre `ui/collapsible`; el botón dice **cuántos hay**, nunca «ver más». |
| `components/bottom-sheet.tsx` | La hoja de filtros del teléfono, sobre `ui/sheet`. |
| `components/paleta.tsx` | «Buscar» en la cabecera de todas las páginas: «¿a dónde vas?», sobre `ui/dialog` + `ui/command` (⌘K, Ctrl K, «/»): todo el índice de `lib/indice.ts` agrupado por tarea y filtrable sin tildes (también por verbo: «votar», «comparar»), lo que el índice de `lib/busqueda.ts` encuentra («En la plataforma», vía `/api/buscar`, a lo sumo la mitad de un mismo tipo), y lo tecleado ofrecido a **cada** búsqueda de `BUSQUEDAS` con su alcance debajo. Lo que el índice no cubre —licitaciones, proveedores, las cámaras— no se finge. |
| `components/ruta.tsx` | La ruta de una ficha sobre `ui/breadcrumb`: la miga entera desde `sm`, solo la vuelta a 44 px en el teléfono. Si se vino de esa vista (`components/rastro.tsx`), volver es el «atrás» del navegador y conserva filtros y posición. |
| `components/paginador.tsx` | Anterior · página · siguiente, con enlaces (`href`) o con estado (`onPage`). Mandos a 44 px en los bordes; el que no aplica se apaga, no desaparece. |
| `components/resaltado.tsx` | Las palabras buscadas en negrita dentro de un título, por raíz (el lematizador español del índice): «escuelas» marca «ESCUELA». Solo servidor. |
| `components/antiguedad.tsx` | La fecha de una fila de listado: `<time>` real, relativa a la vista, exacta en el `title`. |
| `components/esqueleto.tsx` | Las siluetas de **esta** plataforma —ficha, listado, tira de indicadores— compuestas con `ui/skeleton`, con las alturas del contenido. |
| `lib/estados.ts` | **La única** tabla de color de estado, nombrada por significado (`accionable`, `contexto`, `cumplido`, `aviso`, `anulado`). Cada fuente traduce a esos cinco y no guarda tabla propia. También las **etapas** de un proceso de compras (`ETAPAS`, `etapaDe`): la otra traducción de `estado_proceso`, por predicado y no por literal, de la que salen tanto el color como `abierto`. |
| `lib/cifras.ts` | Una cifra con su ancla y su alcance; prohíbe el `+∞ %`, la variación de un porcentaje en por ciento y el denominador sacado de una muestra. |
| `lib/glosario.ts` + `components/termino.tsx` | La jerga traducida en el punto de uso, no en un glosario que nadie abre: `<Termino clave="devengado">` subraya con puntos y abre un `ui/popover` con la frase llana y, si la hay, su guía. Se abre al tocar (un dedo no tiene `hover`), con teclado, y su objetivo de toque mide 44 px sin mover la línea. Una clave nueva va en `glosario.ts` solo si el término aparece en la plataforma. |
| `components/acciones-ficha.tsx` | Seguir, compartir y RSS de una ficha en una línea: la ficha pasa `tipo`, `id`, `titulo`, `href` y los datos crudos del estado (`situacion`). `components/compartir.tsx` escribe el texto según el tipo —nunca «Mira esta licitación» bajo un decreto—. |

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
- **La rejilla de la nómina no es `ui/table`**, y su cabecera lo dice: son cien
  mil plazas virtualizadas, la fila se mide en píxeles para poder saltarse las
  que no se ven y en teléfono se pliega a dos líneas. `ui/table` manda donde hay
  un cuadro de datos normal (los artículos de un proceso); aquí manda el
  desplazamiento fluido.
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

