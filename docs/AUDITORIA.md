# AUDITORÍA — Fuentes de datos del Estado dominicano

Auditoría de campo de las fuentes públicas del Estado dominicano, como fase 0
del **tablero de gobierno**: la evolución del panorama hacia un cuadro de mando
transversal (fiscal, económico, normativo, integridad, electoral, judicial,
social) sobre la misma arquitectura de la plataforma — sin base de datos, sin
claves, lectura en vivo con caché.

- **Fecha:** 2026-08-31
- **Método:** peticiones HTTP directas con User-Agent identificable
  (`Socratico-Inteligencia/1.0`), 2–6 por host, empezando siempre por
  `robots.txt`. Sin volumen, sin evasión de bloqueos, sin tocar nada con
  autenticación.
- **Convención:** ✅ = comprobado contra una respuesta real. ⚠️ = parcial o con
  fricción. ❌ = bloqueado o inviable hoy. Todo lo no marcado es hipótesis.

> Hermano de `RECON.md` (reconocimiento profundo del Congreso). Este documento
> es ancho: mapea el resto del Estado con menos profundidad por fuente, y
> señala dónde hará falta una recon dedicada antes de integrar.

> **Segunda pasada: 2026-09-01.** 43 hosts sondeados; corrige tres veredictos de
> esta primera versión (SIGEF, DGII, DGCP) y cierra los «por mapear». Está al
> final del documento, en **SEGUNDA PASADA**. Las filas de la tabla de abajo
> marcadas **↓** quedan superadas por ella.

---

## 0. Resumen ejecutivo

**El Estado dominicano no tiene una API; tiene tres familias de acceso**, y la
plataforma ya sabe hablar con las tres:

1. **APIs reales, casi siempre con clave.** BCRD (swagger verificado, 6
   endpoints de macrovariables — credenciales requeridas), Superintendencia de
   Bancos (gateway vivo). La clave rompe la regla «sin secretos» de la
   plataforma: integrarlas exige una decisión explícita del dueño (§8.3).
2. **CMS abiertos (WordPress/Umbraco) que publican archivos.** Transparencia
   Fiscal, DIGEPRES, Contraloría, TSS, Hacienda: robots abiertos, sitemaps,
   y datos en XLSX/PDF. La estrella es **Crédito Público**: series de deuda en
   XLSX con URL predecible por mes (§3.3).
3. **Apps de consulta legacy sin API (WebForms/MVC).** La Consultoría Jurídica
   del Poder Ejecutivo (leyes, decretos, reglamentos, resoluciones y Gaceta
   Oficial) se consulta con el mismo patrón token+POST que ya resolvimos para
   el Senado (§4.1).

**El bloqueador real es el WAF, no la política.** El patrón de `robots.txt`
dominante es el bloque gestionado de Cloudflare: veta por nombre a los
rastreadores de *entrenamiento* de IA y deja `User-agent: *` permitido, a veces
con señales de contenido (`ai-train=no, use=reference`). Nuestra lectura en
vivo con atribución es exactamente el uso que esas señales permiten. Pero tres
fuentes valiosas responden 403/challenge al agente honesto (ONE, DGII, Cámara
de Cuentas) — ahí la vía es institucional, no técnica.

| Eje | Fuente | Qué tiene | Vía | Estado |
|---|---|---|---|---|
| Macro | Banco Central | Inflación, IPC, tasas, sector real/externo | API con clave **+ archivos del CDN sin clave** | ⚠️→✅ ↓ §A.6 |
| Macro | ONE / ANDA | Censos, encuestas, microdatos | — | ❌ WAF Cloudflare |
| Fiscal | Crédito Público | Deuda SPNF mensual (saldo, evolución, desembolsos) | **XLSX URL predecible** | ✅ |
| Fiscal | **SIGEF (Hacienda)** | **Ejecución de gastos e ingresos, mensual, por institución** | **API JSON/CSV/XLSX sin clave** | ✅ ↓ §A.1 |
| Fiscal | Transparencia Fiscal | La vitrina que construye las llamadas al SIGEF | WP abierto | ✅ ↓ §A.1 |
| Fiscal | DIGEPRES | Presupuesto, ejecución | WP abierto, PDFs | ⚠️ PDF |
| Fiscal | MapaInversiones | Inversión pública: proyecto ↔ contrato ↔ territorio | **15 CSV abiertos + búsqueda JSON** | ✅ ↓ §A.4 |
| Fiscal | DGII | **Padrón de RNC (788,700 contribuyentes)** | **ZIP estático semanal** | ❌→✅ ↓ §A.2 |
| Normativa | **Consultoría Jurídica** | **Leyes, decretos, reglamentos, resoluciones, Gaceta** | Consulta MVC (token+POST), PDF por GUID | ✅ |
| Integridad | Contraloría | Nóminas aprobadas, informes | WP abierto | ✅ mapear |
| Integridad | Cámara de Cuentas | Declaraciones juradas, auditorías | — | ❌ WAF (HTTP 470) |
| Integridad | datos.gob.do | 1,206 datasets declarados; **159 responden a «nómina»** | Índice HTML paginado (su `/api/` sigue vetado) | ✅ ↓ §A.8 |
| Electoral | JCE | Resultados por elección, estadísticas | Descargas tras CAPTCHA (Zenedge) | ✅→❌ ↓ §B.3 |
| Judicial | Poder Judicial | Sentencias, estadísticas | `transparencia.` sí responde | ⚠️ TLS roto en `www.` |
| Judicial | Tribunal Constitucional | Sentencias TC | Sin robots | ⚠️ sin mapear |
| Social | TSS | Cotizantes, empleadores (mensual) | WP abierto | ✅ mapear |
| Social | SIPEN | Fondos de pensiones | Cloudflare signals, `*` permitido | ⚠️ sin mapear |
| Social | **PUT (DIGEIG)** | **Nómina estatal individual** + consulta de decretos | Power BI sin API utilizable | ⚠️ vía CSV por institución (§5.9) |
| Admin. | SISMAP + SISMAP Municipal | Gestión pública e institucional, y por ayuntamiento | **Tablas server-rendered** (no hay SPA) | ⚠️→✅ ↓ §A.7 |
| Finanzas | Superintendencia de Bancos | Series del sistema financiero | `apis.sb.gob.do` vivo | ⚠️ clave |
| Comercio | DGA (Aduanas) | Comercio exterior | Sin robots; sin ruta estable hallada | ⚠️ ↓ §A.10 |
| Compras | **DGCP (ya integrada)** | **+ ofertas, proveedores, catálogo y PACC** | Misma API abierta, endpoints sin usar | ✅ ↓ §A.3 |
| Precios | **MICM** | **Precios de combustibles, semanales** | Portada + sitemap de avisos | ✅ ↓ §A.5 |

---

## 1. Línea base: lo ya integrado

| Fuente | Capa | Mecánica |
|---|---|---|
| DGCP (compras) | `lib/dgcp.ts` | API JSON abierta, paginada |
| SIL Cámara de Diputados | `lib/congreso.ts` | API JSON interna sin auth |
| SIL Senado (consultante) | `lib/senado.ts` | HTML + sesión por colección + postback |
| Nómina (instantánea) | `lib/nomina*.ts` | JSON estático propio |

La plataforma ya demostró tres capacidades que esta auditoría vuelve a
necesitar: leer APIs JSON hostiles a bots (UA identificable + validación de
content-type), automatizar apps WebForms con sesión y ViewState, y cachear
resultados parseados con `unstable_cache` cuando el caché de fetch no aplica.

---

## 2. Eje macroeconómico

### 2.1 Banco Central (BCRD) — ⚠️ API oficial con credenciales

- ✅ `www.bancentral.gov.do` **no tiene robots.txt** (redirige a E404).
- ✅ `api.bancentral.gov.do/swagger/v1/swagger.json` responde: **API BCRD v1**
  con 6 endpoints POST estilo RPC (framework ABP):
  `MacroVariables/Inflacion`, `v2/HistoricoIPC`, `MacroVariables/Monetarias`,
  `SectorReal`, `SectorExterno`, `HistoricoTasas`.
- ✅ Probado `Inflacion` con cuerpo vacío → `{"success":false, "error":
  {"message":"Credenciales de acceso inválidas"}}`. El `MacroInputDto` lleva
  las credenciales; el portal para desarrolladores es
  `apibcrd.bancentral.gov.do` (enlazado en el pie oficial como «API»).
- ⚠️ Los archivos estadísticos históricos (`gdc.bancentral.gov.do/...`)
  reorganizaron sus rutas: el clásico `DOLAR_REFERENCIA_MC.xls` da 404. Las
  series siguen publicadas vía la sección de estadísticas; URLs por re-mapear.

**Lectura:** la fuente macro más valiosa del país (tipo de cambio, inflación,
tasas) está a un registro de distancia. El costo no es técnico: es la regla
«sin variables de entorno» de la plataforma (§8.3).

### 2.2 ONE / ANDA — ❌ WAF

- ✅ `one.gob.do/robots.txt`: bloque Cloudflare con señales de contenido —
  `User-agent: *` → `Allow: /` con `ai-train=no, use=reference`. **La política
  permite nuestro uso** (lectura en vivo, referencia con atribución).
- ❌ Pero la home responde **403** al UA identificable, y el catálogo de
  microdatos `anda.one.gob.do` sirve el challenge «Just a moment…» de
  Cloudflare incluso en su API (`/index.php/api/catalog/search`).
- **Vía de desbloqueo:** solicitud a la ONE (Ley 200-04 o su mesa de datos
  abiertos) para lista blanca del UA/IP. No evadir el challenge.

---

## 3. Eje fiscal

### 3.1 Portal de Transparencia Fiscal — ✅

- ✅ `www.transparenciafiscal.gob.do` — WordPress; robots solo veta
  `/wp-admin/`; **su API REST de WP está expuesta** (`/wp-json/`), a
  diferencia del WP del Senado.
- ✅ Secciones de ejecución: `/presupuesto/`, `/ingresos/ejecucion-de-los-ingresos/`,
  `/gastos/ejecucion-de-los-gastos/`, `/financiamiento/`, `/gobiernos-locales/`
  y **`/datos-abiertos/`** con «Diccionario de Datos» en XLSX.
- ⚠️ Los formatos concretos por sección (CSV vs XLSX vs Power BI embebido)
  quedan por mapear en la recon dedicada.

### 3.2 DIGEPRES — ⚠️ abierto pero en PDF

- ✅ `digepres.gob.do` (sin `www`) — WP, robots `Disallow:` vacío (todo
  permitido), sitemap.
- ⚠️ Lo visible en portada es informe de ejecución **en PDF**
  (`Informe-Ejecucion-presupuestaria-Junio-2026.pdf`). Los datos estructurados
  del presupuesto viven en Transparencia Fiscal (§3.1) y en su «presupuesto
  ciudadano».

### 3.3 Crédito Público (deuda) — ✅ la estrella del eje

- ✅ `www.creditopublico.gob.do` — ASP.NET MVC; sin robots real (catch-all).
- ✅ `/inicio/estadisticas` publica las series de **deuda del Sector Público
  No Financiero** como XLSX con URL predecible:

  ```
  /Content/estadisticas/anual/2026/11Julio/09Saldo Deuda Histórico Sector Público No Financiero por Acreedor.xlsx
  /Content/estadisticas/anual/2026/11Julio/08Saldo Evolución Deuda del Sector Público No Financiero.xlsx
  /Content/estadisticas/anual/2026/11Julio/06Evolución Mensual de la Deuda Interna….xlsx
  /Content/estadisticas/anual/2026/13Junio/…   ← mes anterior, mismo esquema
  ```

  Patrón: `/Content/estadisticas/anual/{año}/{NN}{Mes}/{NN}{serie}.xlsx`, un
  juego por mes. Saldo, evolución interna/externa, desembolsos por fuente.
- Es el candidato #1 del tablero: indicador de deuda actualizado mensualmente,
  sin clave, sin WAF, con historia.

### 3.4 MapaInversiones — ✅ vivo, por mapear

- ✅ `mapainversiones.gob.do/Home` responde 200 (211 KB, **server-rendered**,
  ASP.NET MVC — no una SPA): inversión pública proyecto a proyecto
  (plataforma BID; `mapainversiones.economia.gob.do` redirige aquí).
- ⚠️ Sus endpoints JSON internos (los que alimentan los gráficos) quedan por
  extraer del HTML/JS en la recon dedicada.

### 3.5 Hacienda — ✅ abierta (paraguas)

- ✅ robots Yoast: solo veta rutas de comunidad; sitemap disponible. Es el
  paraguas institucional; los datos operativos están en §3.1 y §3.3.

### 3.6 DGII — ❌ hoy

- ❌ El histórico web service público de RNC (`/wsMovilDGII/WSMovilDGII.asmx`)
  **fue retirado**: redirige al home en ambos hosts.
- ❌ La consulta RNC web (`/app/WebApps/ConsultasWeb/consultas/rnc.aspx`)
  responde **403** al agente identificado.
- **Impacto:** el cruce RNC↔proveedores DGCP (enriquecer `/proveedores/[rpe]`)
  queda bloqueado salvo acuerdo con DGII. No evadir el 403.

---

## 4. Eje normativo e integridad

### 4.1 Consultoría Jurídica del Poder Ejecutivo — ✅ el hallazgo del eje

- ✅ `www.consultoria.gov.do/robots.txt`: **solo** el preámbulo de señales de
  contenido de Cloudflare, sin una sola regla `User-agent`/`Disallow` — sin
  restricciones declaradas.
- ✅ `/consulta/` («Consulta Externa») — app MVC de **Leyes y Decretos** con
  taxonomía verificada en su formulario:

  | Código | Tipo |
  |---|---|
  | 1 | Leyes |
  | 3 | Decretos |
  | 4 | Reglamentos |
  | 5 | Varios |
  | 7 | Resoluciones |
  | 1014 | **GACETA OFICIAL** |

- Mecánica: búsqueda vía `POST /Consulta/Home/Search` con
  `__RequestVerificationToken` (antiforgery) — **el mismo patrón
  página→token→POST que ya automatizamos para el Senado**. Documentos
  descargables por GUID (`/Documents/GetDocument?reference={guid}`).
- Es la fuente del vertical **Normativa**: «qué decreta el Ejecutivo» — la
  tercera pata que falta al triángulo legislativo (Diputados ✅, Senado ✅,
  Ejecutivo ⬜).

### 4.2 Contraloría — ✅ abierta, por mapear

- ✅ WP con robots abierto y sitemap. Publica informes y nóminas aprobadas;
  formatos por mapear.

### 4.3 Cámara de Cuentas — ❌ WAF

- ❌ `www.camaradecuentas.gob.do` responde **HTTP 470** (código no estándar de
  bloqueo) con página de 33 KB a cualquier ruta, robots incluido. Las
  declaraciones juradas de patrimonio — pieza central de integridad — quedan
  inalcanzables por ahora. Vía: Ley 200-04.

### 4.4 datos.gob.do — ⚠️ CORRECCIÓN: útil como índice, no como API

- ✅ robots **sin cambios** desde la recon: `Disallow: /api/` (y `/revision/`,
  `/dataset/*/history`), `Crawl-Delay: 10`.
- ⚠️ `/dataset/` sirve un cascarón con render en cliente: ni el conteo de
  datasets es visible server-side.
- ✅ **Pero la búsqueda HTML (`/dataset?q=`) sí expone los slugs**, y las
  fichas de dataset exponen **las URL directas de los archivos** en los
  portales institucionales (`{institución}.gob.do/...nomina.csv`). Por esa vía
  —sin tocar `/api/`— se localizaron las nóminas CSV de 10 instituciones que
  hoy alimentan la foto transversal de `/nomina` (§5.9). El veredicto sube de
  «marginal» a **índice útil de enlaces directos**; su API sigue vetada por su
  propio robots.

---

## 5. Eje electoral, judicial y social

### 5.1 JCE — ✅ accesible, mapear por elección

- ✅ Sin robots (404). Home enlaza **`elecciones2024.jce.gob.do`**
  (presidenciales/congresuales y municipales), `jce.gob.do/Estadisticas`,
  histórico de «Elecciones Anteriores» y un repositorio de resultados.
- ⚠️ El sitio de resultados es DotNetNuke server-rendered; cada comicio tiene
  su propio sitio y formato (los boletines JSON de la noche electoral suelen
  existir pero cambian por elección). Recon dedicada por comicio.

### 5.2 Poder Judicial — ⚠️ matiz importante

- ❌ `www.poderjudicial.gob.do` **no valida TLS desde este entorno**: «unable
  to get local issuer certificate» — cadena incompleta en el servidor (falta
  el intermedio), no un geobloqueo. Puede funcionar desde otros egress que
  completen la cadena vía AIA.
- ✅ **`transparencia.poderjudicial.gob.do` sí responde** (Azure): robots
  abierto salvo `/reportePDF/`. Vía viable para estadísticas/portal de
  transparencia judicial.

### 5.3 Tribunal Constitucional — ⚠️ sin mapear

- ✅ Sin robots (404). El buscador de sentencias TC queda por recon dedicada.

### 5.4 TSS — ✅ abierta, por mapear

- ✅ WP, robots solo veta `/wp-admin/`. Publica estadísticas mensuales de
  cotizantes/empleadores (histórico en XLSX); URLs por mapear.

### 5.5 SISMAP — ⚠️ SPA con API interna

- ✅ Sin robots; landing en `/` y app real en `/GestionPublica` (cascarón de
  3 KB → Angular). Sus indicadores de gestión pública municipal/institucional
  se sirven por una API interna que hay que extraer del bundle (patrón
  Diputados).

### 5.6 Superintendencia de Bancos — ⚠️ API con clave

- ✅ `sb.gob.do` — Umbraco, robots solo veta `/umbraco`.
- ✅ **`apis.sb.gob.do` existe y responde JSON** (`{"statusCode":404,
  "message":"Resource not found"}` en raíz — gateway estilo APIM vivo).
  El programa de APIs de la SB requiere suscripción; mismo dilema que BCRD.

### 5.7 SIPEN — ⚠️ permitida, por mapear

- ✅ robots Cloudflare-managed: veta rastreadores de IA por nombre;
  `User-agent: *` permitido. Series de pensiones por mapear.

### 5.8 DGA (Aduanas) — ⚠️ por mapear

- ✅ Sin robots (404). Estadísticas de comercio exterior por recon dedicada.

### 5.9 Nómina estatal — Portal Único de Transparencia (añadido en esta pasada)

Investigación disparada por la pregunta «¿dónde vive la nómina estatal
completa?»:

- ✅ **`transparencia.gob.do`** (Portal Único de Transparencia, DIGEIG) existe:
  WordPress con `wp-json` abierto. Su sección **Consultas** publica dos
  tableros ciudadanos: **Nóminas** y «Consulta Oficial de Decretos del Poder
  Ejecutivo».
- ✅ El tablero de Nóminas es un **Power BI «publish to web»** con la nómina
  estatal a nivel **individual** (nombre, función, institución, sueldo bruto),
  filtros de año/mes y actualización declarada a 2025 — la vista completa del
  Estado que ninguna otra fuente ofrece.
- ❌ Su API subyacente no es utilizable desde un servidor: el flujo público de
  Power BI respondió **403** a `modelsAndExploration` en todos los clústeres
  probados (exige el intercambio anti-CSRF del propio JS del embed), el
  `global-redirect` está vetado por la política de egreso de este entorno, y
  `app.powerbi.com` resetea la conexión del navegador headless a través del
  proxy. Extraerlo en vivo queda descartado; el detalle individual completo
  además excedería el patrón sin-BD de la plataforma.
- ✅ **La vía que sí funciona**: las nóminas CSV que cada institución publica
  bajo Ley 200-04, localizadas vía datos.gob.do (§4.4) y consolidadas por
  `scripts/build-nomina.py` en la foto transversal de `/nomina` (último mes
  publicado por institución, sin nombres). Cobertura inicial: 11 instituciones,
  13,668 plazas, RD$569.6M de masa mensual; ampliar = añadir una línea al
  manifiesto. La cobertura parcial se declara en la UI y el tablero oficial
  queda enlazado como fuente del detalle completo.
- Los formatos reales exigieron tolerancia verificada: delimitadores `,`/`;`,
  codificaciones UTF-8/cp1252/**cp850** (heredada de DOS), columnas sinónimas
  (CARGO/FUNCIÓN/RANGO…), y filas con fechas futuras erróneas que el
  consolidador descarta.

---

## 6. Patrones transversales (lo que enseña la auditoría)

1. **Tres familias de acceso** (§0). Cada nueva integración cae en una de
   ellas, y la plataforma ya tiene el adaptador de referencia para cada una:
   `dgcp.ts` (API JSON), archivos con URL predecible (nómina; deuda §3.3),
   `senado.ts` (app legacy con sesión/token).
2. **El robots dominicano de 2026 es el bloque Cloudflare anti-IA.** Veta
   `ClaudeBot`/`GPTBot` (rastreo de entrenamiento) y permite `*`; donde hay
   señales, dicen `ai-train=no` + `use=reference`. Nuestro patrón — lectura en
   vivo, bajo volumen, atribución, sin entrenar nada — es el caso de uso que
   esas políticas contemplan como permitido. Mantener el UA identificable es
   lo que nos deja del lado correcto de esa línea.
3. **WAF ≠ política.** ONE permite por robots y bloquea por Cloudflare; la
   Cámara de Cuentas responde un 470 no estándar; DGII 403. La respuesta
   correcta es institucional (lista blanca, Ley 200-04), nunca rotar UA/IP.
4. **TLS mal configurado se disfraza de bloqueo** (PJ §5.2). Diagnosticar
   antes de declarar una fuente muerta; a veces hay un host hermano bien
   configurado (`transparencia.`).
5. **Los portales «de datos abiertos» formales rinden menos que las apps de
   consulta operativas.** datos.gob.do (2 verificaciones) y los PDF de
   DIGEPRES rinden menos que el consultante del Senado, la consulta de la
   Consultoría o los XLSX de Crédito Público. Buscar la herramienta que la
   institución usa de verdad, no la vitrina.

---

## 7. El tablero de gobierno: modelo

El panorama de `/` ya es un tablero embrionario (indicadores + señales). El
tablero de gobierno es su generalización en tres capas, todas sobre la
arquitectura actual:

1. **Indicadores** — cifras de cabecera por eje con fecha de corte declarada:
   deuda SPNF (mensual), inflación/tasa de cambio (diaria, si BCRD),
   ejecución presupuestaria (mensual), cotizantes TSS (mensual). Cada
   indicador es una función en su `lib/*` + una tarjeta en `/`.
2. **Señales** — lo que exige atención ahora (el panorama ya tiene dos:
   cierres de licitaciones y perención). Nuevas: decretos de la semana,
   emisiones de deuda recientes, nuevo mes de ejecución publicado.
3. **Verticales** — profundidad navegable por dominio (hoy: licitaciones,
   congreso, nómina). Siguientes: **normativa** (Consultoría) y **finanzas
   públicas** (deuda + ejecución).

Regla de honestidad que hereda todo el tablero: cada indicador declara su
fuente y su fecha de corte, y `/fuentes` documenta cada conexión con sus
límites (como ya hace con las cuatro actuales).

---

## 8. Plan de integración por fases

> **Estado (2026-09-01): Fases 1 y 2 implementadas y en producción.** El
> indicador de deuda (`lib/deuda.ts`, tarjeta en el panorama) y la vertical de
> normativa (`lib/normativa.ts`, `/normativa`) ya están desplegados. Ambos
> siguen el patrón sin-BD. Además se implementó **Democracia Legislativa**
> (`/democracia`), la única excepción con base de datos, documentada en
> `PLAN-DEMOCRACIA.md`.

### Fase 1 — Deuda pública (Crédito Público) · esfuerzo bajo, valor alto
- `lib/deuda.ts`: resolver el XLSX del mes vigente sondeando el patrón de URL
  (§3.3) con fallback al mes anterior; parsear la serie de saldo/evolución;
  `unstable_cache` con ventana diaria. **Decisión previa:** parsear XLSX exige
  una dependencia (p. ej. `exceljs`) o un parser mínimo propio de la hoja
  concreta; alternativa sin dependencia: indicador de «último mes publicado» +
  enlace, sin cifras. Recomendación: dependencia liviana, los datos lo valen.
- Panorama: tarjeta «Finanzas públicas» con saldo total, variación mensual y
  fecha de corte. `/fuentes`: entrada nueva.

### Fase 2 — Normativa del Ejecutivo (Consultoría Jurídica) · esfuerzo medio, valor alto
- `lib/normativa.ts` con el patrón Senado: GET `/consulta/` → extraer
  `__RequestVerificationToken` → `POST /Consulta/Home/Search` (tipo 3 =
  decretos; 1 = leyes; 1014 = Gaceta), parsear resultados, documentos vía
  `GetDocument?reference={guid}`.
- Vertical `/normativa` (sección nueva en `lib/secciones.ts`): listado por
  tipo + búsqueda + señal «decretos de los últimos 7 días» en el panorama.
- Recon previa: 1 sesión para fijar la forma exacta de la respuesta del Search
  (HTML parcial AJAX) y su paginación.

### Fase 3 — Macro (BCRD) · esfuerzo bajo, requiere decisión de secretos
- La API BCRD necesita credenciales → **rompe la regla «sin variables de
  entorno»**. Opciones, en orden de preferencia:
  1. Registrarse y aceptar **una** excepción acotada (una env var en Vercel,
     documentada en CLAUDE.md como la única).
  2. Re-mapear los archivos públicos de `gdc.bancentral.gov.do` (sin clave,
     más frágil).
  3. Posponer el eje macro.
- Con (1): `lib/macro.ts` (inflación interanual, tasas de referencia, tipo de
  cambio) + indicadores en panorama.

### Fase 4 — Ampliaciones mapeadas
- **Transparencia Fiscal**: recon de `/datos-abiertos/` y series de ejecución;
  `lib/fiscal.ts`; completa el vertical de finanzas públicas junto a la deuda.
- **MapaInversiones**: extraer los endpoints de sus gráficos; capa de
  inversión pública por provincia (conecta con la vertical de licitaciones).
- **TSS**: serie mensual de cotizantes (indicador social).
- **PJ (host transparencia)** y **TC**: recon de sentencias/estadísticas.
- **JCE**: por comicio, empezando por 2024 (archivo histórico, no alerta).

### Sin vía hoy (y su desbloqueo)
| Fuente | Bloqueo | Vía de desbloqueo |
|---|---|---|
| ONE / ANDA | Challenge Cloudflare | Lista blanca / mesa de datos abiertos |
| DGII (RNC) | 403 + WS retirado | Acuerdo institucional |
| Cámara de Cuentas | HTTP 470 | Ley 200-04 |
| datos.gob.do | robots prohíbe su API | Señalar el absurdo a la OGTIC |

---

## 9. Reglas de arquitectura para el tablero

- **Un `lib/*.ts` por fuente, un contrato**: timeout, un reintento, UA
  identificable, validación de content-type, degradar a `null`, jamás tumbar
  la página. Caché por volatilidad del dato (diaria para series mensuales,
  minutos para lo vivo), con `unstable_cache` cuando la fuente exige sesión o
  URLs volátiles (precedente: `lib/senado.ts`).
- **El panorama no espera a nadie**: cada indicador llega por `Promise.all`
  tolerante a fallos individuales, como hoy.
- **`/fuentes` crece con cada conexión** — es el contrato público del tablero:
  qué se lee, con qué límites, qué está bloqueado y por qué.
- **Nunca**: evadir un WAF o challenge, rotar UA, tocar endpoints con
  autenticación ajena, scrapear donde el robots del host lo prohíba para `*`.

---

## 10. Pendientes, en orden

1. Decisión del dueño sobre §8.1 (dependencia XLSX) y §8.3 (excepción de
   credenciales BCRD).
2. Fase 1 (deuda) — ejecutable ya con esta auditoría.
3. Recon dedicada de la Consultoría Jurídica (forma de respuesta del Search) →
   Fase 2.
4. Recon de Transparencia Fiscal `/datos-abiertos/` (formatos por sección).
5. Solicitudes institucionales: ONE (lista blanca), Cámara de Cuentas
   (Ley 200-04) — plazo largo, arrancar en paralelo.
6. Verificar desde el egress de producción el TLS de `www.poderjudicial.gob.do`
   (el fallo puede ser específico del proxy de este entorno).

---

# SEGUNDA PASADA — 2026-09-01

Auditoría de campo completa sobre las fuentes que la primera pasada dejó como
«por mapear», más un barrido de ejes que no había tocado (energía, telecom,
salud, seguridad, municipal, laboral, comercio exterior): **más de 60 hosts
sondeados** con el mismo método — UA identificable, robots primero, sin volumen,
sin evadir ningún bloqueo.

> **Tres conclusiones de la primera pasada quedan corregidas**, y las tres iban
> en la dirección de **subestimar** lo que el Estado publica: la ejecución
> presupuestaria tiene API abierta (§A.1), el padrón de RNC de la DGII se
> descarga sin clave (§A.2), y la API de compras que ya integramos tiene cuatro
> endpoints que no estábamos usando (§A.3).
>
> **Estado (2026-09-01): §A.1 y §A.3 ya están implementados y desplegados.**
> La vertical de finanzas públicas (`/finanzas`, `lib/fiscal.ts`,
> `scripts/build-fiscal.py`) y los cuatro endpoints de la DGCP —ofertas en la
> ficha de proceso, registro en la de proveedor, planes en `/planes`— son las
> fases 5 y 6 de §D. Queda pendiente §A.2 (padrón RNC), que exige decidir la
> instantánea derivada en build.

## 0. Lo que cambia el veredicto

| Fuente | Antes | Ahora | Por qué |
|---|---|---|---|
| **SIGEF / Hacienda** | no aparecía | ✅ **API JSON/CSV/XLSX sin clave** | §A.1 — ejecución de gastos e ingresos, mes a mes, institución por institución |
| **DGII** | ❌ 403, WS retirado | ✅ **padrón RNC descargable** (⚠️ consulta web sigue vetada) | §A.2 — 26.6 MB, 788,700 contribuyentes, actualizado 29-ago-2026 |
| **DGCP** | ✅ integrada (3 endpoints) | ✅ **+4 endpoints sin explotar** | §A.3 — ofertas, proveedores, catálogo, PACC |
| **MapaInversiones** | ⚠️ «endpoints por extraer» | ✅ **15 CSV abiertos + búsqueda JSON** | §A.4 |
| **BCRD** | ⚠️ credenciales; archivos «404» | ⚠️→✅ **el CDN sí sirve las series** | §A.6 — la ruta del histórico de tasa de cambio responde 200 |
| **MICM** | no aparecía | ✅ precios de combustibles semanales | §A.5 |
| **SISMAP** | ⚠️ «SPA con API interna» | ✅ **tablas server-rendered** (no hay SPA que romper) | §A.7 |
| **datos.gob.do** | ⚠️ índice útil | ✅ 1,206 datasets; **74 de nómina** frente a 11 integradas | §A.8 |
| **JCE** | ✅ «mapear por elección» | ❌ descargas tras CAPTCHA (Zenedge) | §B.3 |
| **911, Migración, SIMV** | no aparecían | ❌ WAF | §B |
| ONE · Cámara de Cuentas | ❌ | ❌ **sin cambios** | §B.1 |

---

## A. Hallazgos verificados

### A.1 ⭐ API de datos abiertos del SIGEF — la columna vertebral fiscal

El generador de «Datos abiertos» del Portal de Transparencia Fiscal (§3.1) no
sirve archivos: **construye llamadas a una API pública del Ministerio de
Hacienda**, hasta ahora no documentada en esta auditoría.

```
https://api-sigef.hacienda.gob.do/servicios/datosabiertos/portaltransparencia/
  {tipo}/{archivo}/{año}/{mes}/{formato}?seccion={sección}&capitulo={institución}
```

- ✅ **Sin clave, sin sesión, sin token.** Spring Boot; 404 en JSON limpio para
  rutas inexistentes (no hay la trampa del 200-que-no-existe del SIL).
- ✅ Tres formatos por la misma ruta: `json`, `csv`, `xlsx`.
- ✅ **Taxonomía verificada** (leída del formulario y probada contra el
  servidor):

  | tipo | archivos (`{archivo}`) |
  |---|---|
  | `ingresos` | `percibidosinstitucion`, `ftefinanc` |
  | `gastos` | `institucion` (quién gasta), `concepto` (en qué), `finalidad` (para qué), `inversion` (dónde), `fuentefinanciamiento`, `organismofinanciador`, `transferencias`, `aplicacionesfinancieras` |
  | `gastos` (institucional) | `institucionalconcepto`, `institucionalfinalidad` |

- ✅ **Secciones**: `11111` administración central, `11112` descentralizadas y
  autónomas no financieras, `11113` seguridad social.
- ✅ **Capítulos**: los **104 códigos institucionales** del presupuesto, del
  `0101` (Senado) al `5211` (TSS), incluyendo `0998`/`0999` (deuda pública y
  obligaciones del Tesoro) — 34 de administración central, 61 descentralizadas,
  9 de seguridad social. Quedaron capturados en `lib/capitulos.ts`.
  *(Corrección: esta auditoría dijo primero «99». Eran los que cabían en los
  40 KB que leyó el primer barrido; el bloque completo mide 86 KB.)*
- ✅ **Respuestas reales comprobadas**:
  - `gastos/institucion/2026/08/json?seccion=11111&capitulo=0206` → 41 KB,
    ejecución del Ministerio de Educación por unidad ejecutora y mes, con
    `PRESUPUESTO INICIAL`, `PRESUPUESTO VIGENTE`, `PREVENTIVO`, `COMPROMISO`,
    `DEVENGADO`, `PAGADO`.
  - `gastos/concepto/2026/08/json?...&capitulo=0207` → 862 KB, Salud Pública
    por cuenta (`2.1.1.1.01 REMUNERACIONES`…).
  - `ingresos/percibidosinstitucion/2026/08/json?...&capitulo=0205` → 51 KB.
  - `gastos/institucion/2025/12/csv?...&capitulo=0206` → 28 KB.
- ⚠️ **Latencia asimétrica y decisiva para el diseño**: el año corriente se
  calcula en vivo (medidos **22 s**, **23 s** y **86 s** según el corte; una
  consulta sin `capitulo` —sección entera— no respondió en 40 s), mientras un
  año cerrado responde **en 0.4 s** (cacheado arriba). La
  regla de los 25 s de `dgcpFetch` **no sirve aquí**: hay que ir a `unstable_cache`
  con ventana diaria, consulta por institución (nunca sección completa), y
  precalentar el mes vigente.
- ⚠️ El `content-type` es `application/csv` incluso cuando el cuerpo es JSON:
  validar por forma del cuerpo, no por cabecera.
- ❌ `sigef.hacienda.gob.do` (la app SIGEF) responde 403 Cloudflare — pero es
  irrelevante: la API vive en otro host y está abierta.

**Qué habilita**: la pregunta que la plataforma todavía no puede responder —
«¿en qué se gasta el dinero, institución por institución, mes a mes?» — con
la trazabilidad completa del ciclo (vigente → comprometido → devengado →
pagado). Es la pieza que convierte el panorama en tablero fiscal.

### A.2 ⭐ DGII — el padrón de RNC sí se descarga

La primera pasada declaró la DGII cerrada. Es cierto para la **consulta web**
(`rnc.aspx` y el viejo `wsMovilDGII` devuelven la portada: 200 que no es la
ruta), y su sección de estadísticas responde 403. Pero:

- ✅ `https://dgii.gov.do/app/WebApps/Consultas/RNC/RNC_CONTRIBUYENTES.zip`
  responde **200**, `application/x-zip-compressed`, **26,608,208 bytes**,
  `last-modified: 29-ago-2026`, con `accept-ranges: bytes`.
- ✅ Contiene `RNC_Contribuyentes_Actualizado_29_Ago_2026.csv` (115 MB), en
  **cp850** —la misma herencia DOS que ya toleran las nóminas—, con columnas
  `RNC, RAZÓN SOCIAL, ACTIVIDAD ECONÓMICA, FECHA DE INICIO OPERACIONES, ESTADO,
  RÉGIMEN DE PAGO`.
- ✅ **788,700 contribuyentes**: 395,737 activos, 309,059 suspendidos, 74,883
  dados de baja, 7,490 en cese temporal, 1,256 anulados, 275 rechazados.
- ❌ `DGII_RNC.zip` (el nombre antiguo) da 403. El robots de la DGII solo veta
  rutas de SharePoint (`/_layouts/`, `/_vti_bin/`, `/_catalogs/`).

**Qué habilita**: cruzar cada proveedor del Estado con su registro tributario —
actividad económica declarada, estado, antigüedad. La señal clásica de riesgo
(«RNC creado semanas antes de ganar el contrato») deja de ser inverificable.
**Restricción de arquitectura**: 26 MB no se descargan por request. La vía
compatible con la plataforma sin BD es una **instantánea derivada en build**
(el patrón de `scripts/build-nomina.py`), reducida a los RNC que aparecen como
proveedores en compras.

### A.3 ⭐ DGCP — cuatro endpoints abiertos que no estamos usando

Misma API que ya integra `lib/dgcp.ts`, mismo adaptador, **cero hosts nuevos**:

| Endpoint | Contenido | Por qué importa |
|---|---|---|
| `/ofertas` | `id_oferta, codigo_proceso, rpe, razon_social, valor_oferta, estado_oferta, estado_evaluacion, tipo_oferta, fecha_entrega_oferta, fecha_evaluacion` | **Quién compitió, no solo quién ganó**: procesos de oferente único, parejas que siempre concursan juntas, ofertas descartadas |
| `/proveedores` | `rpe, razon_social, tipo_documento, numero_documento (RNC), estado, tipo_persona, forma_juridica, fecha_creacion_empresa, fecha_registro_rpe, numero_registro_mercantil, es_mipyme, certificacion_micm, clasificacion_empresarial, provincia, municipio…` (35 campos) | Perfil real en `/proveedores/[rpe]`, hoy construido solo a partir de contratos. **Trae el RNC**: es la llave de unión con §A.2 sin depender de la DGII. Mecánica de campo verificada en **§A.12** |
| `/catalogo` | UNSPSC completo: segmento → familia → clase → subclase, con definición y sinónimos | Da nombre legible a las subclases que ya usa `getPreciosSubclase` |
| `/pacc` | Planes anuales de compras por unidad, con período, versión, responsable y URL | **Lo que el Estado planea comprar** antes de publicarlo: señal anticipada |

- ✅ Los cuatro responden 200 con el mismo sobre (`code/hasError/payload.content`)
  que ya normaliza `dgcpFetch`.
- ⚠️ `/proveedores` incluye teléfonos y correos de contacto comercial. Son
  públicos por registro, pero mostrarlos en ficha convierte la plataforma en un
  directorio de contactos: la postura correcta es **usar los campos
  institucionales y no exponer los de contacto**.
- ❌ No existen `/adjudicaciones`, `/articulos`, `/documentos`, `/sanciones` ni
  swagger: el catálogo de endpoints se descubre probando.

### A.4 MapaInversiones — 15 CSV abiertos, no solo gráficos

- ✅ `/DatosAbiertos` publica **descarga directa, sin clave**, con diccionario
  XLSX por dataset:
  `DatosAbiertosProyectosDeInversion.csv` (4.0 MB),
  `DatosAbiertosContratosXProyectosInv.csv` (6.8 MB),
  `DatosAbiertosProcesosXProyectosInv.csv`,
  `DatosAbiertosPresupuestoXProyInv.csv`,
  `…XFuenteFinanciacion.csv`, `…XTerritorio.csv`,
  `DatosabiertosPresupuestoHacienda.csv`,
  y siete de compras de emergencia (procesos, contratos, ofertas, proveedores,
  artículos, apropiación presupuestaria).
- ✅ Campos comprobados en la cabecera real: los proyectos traen
  `CodigoSNIP, EstadoProyecto, ValorDelProyecto, AvanceFinanciero, AvanceFisico,
  EntidadEjecutora, Sector, FechaCorteFuente`; los contratos traen
  `CodigoSnip, CodigoProceso, CodigoContrato, ValorContrato, CodigoProveedor,
  Proveedor, UrlContrato` **con la URL al proceso en comprasdominicana**.
- ✅ Búsqueda JSON abierta: `/BusquedaAsync/?SearchString=` devuelve proyectos
  con su `url` de ficha; las fichas (`/projectprofile/{id}`) son
  server-rendered (costo estimado, avance financiero, provincia, sector).

**Qué habilita**: el eslabón que le falta a la vertical de compras —
`SNIP → proyecto → proceso → contrato → proveedor → territorio`. `Proceso` ya
tiene `es_snip`/`codigo_snip`: la unión es directa.

### A.5 MICM — precios de combustibles, semanales

- ✅ `micm.gob.do` con robots Yoast abierto (`Disallow:` vacío).
- ✅ El tipo de contenido `post_combustibles` tiene sitemap propio con **613
  avisos** —dos series semanales, combustibles líquidos y gas natural— al día
  (`aviso-precios-combustibles-del-29-al-04-septiembre-2026`).
- ✅ Los precios vigentes se leen de la portada: **Gasolina Premium 341.10,
  Gasolina Regular 310.50, Gasoil Óptimo 293.10, Gasoil Regular 262.80**
  (RD$/galón, semana verificada).
- ⚠️ **Límite honesto**: el cuerpo del aviso semanal está **vacío en HTML**
  (comprobado en dos semanas distintas y en el RSS del tipo de contenido) y su
  `wp-json` está deshabilitado. Solo hay cuatro precios en portada; el aviso
  completo (GLP, gas natural, kerosene, fuel oil) no es legible por máquina.
  La fecha de vigencia se deriva del título del último aviso del sitemap.

### A.6 BCRD — CORRECCIÓN: el CDN sí sirve las series

La primera pasada dio por muertos los archivos estadísticos. No lo están:

- ✅ `https://cdn.bancentral.gov.do/documents/estadisticas/mercado-cambiario/documents/TASA_DOLAR_REFERENCIA_MC.xls`
  → **200, 915 KB**. El histórico de tasa de cambio de referencia está
  disponible **sin credenciales**.
- ✅ El patrón es `cdn.bancentral.gov.do/documents/estadisticas/{sección}/documents/{ARCHIVO}`,
  con secciones `mercado-cambiario`, `precios`, `sector-real`, `sector-externo`,
  `sector-fiscal`, `sector-monetario-y-financiero`, `sector-turismo`,
  `mercado-de-trabajo`.
- ⚠️ Los **nombres de archivo por sección** no se pueden enumerar: las páginas
  (`/a/d/2534-precios`, `/a/d/2538-mercado-cambiario`) montan la lista por JS y
  el HTML servido no la contiene; adivinar nombres falló (4 intentos, 404).
  Enumerarlos exige un navegador — imposible en este entorno (§B.5) — o pedir
  el índice al BCRD.
- ⚠️ La API con credenciales (`api.bancentral.gov.do`) sigue igual: el dilema
  de §8.3 se **reduce**, no desaparece — el tipo de cambio ya no la necesita.

### A.7 SISMAP — no hay SPA: las tablas vienen servidas

- ✅ `/GestionPublica/Ranking/RankingView` devuelve **181 organismos** en tabla
  HTML servida — `Posición | Organismo | Sector Gobierno | Valoración` (1º
  Autoridad Nacional de Asuntos Marítimos 97.40 %, 2º Ministerio de Energía y
  Minas 93.97 %, 3º Ministerio de Turismo 93.47 %…).
- ✅ **SISMAP Municipal** (`/Municipal`) da el mismo ranking para gobiernos
  locales, con ficha por ayuntamiento (`/Municipal/ayuntamientos/{id}`) y
  desglose gestión interna / servicios.
- La primera pasada supuso una API interna que hay que extraer del bundle: no
  hace falta. Es parseo de tabla, el patrón más barato de la casa.

### A.8 datos.gob.do — dimensionado

- ✅ El portal declara **1,206 conjuntos de datos**. Ojo: esa cifra **no varía
  con la consulta** (idéntica en `/dataset` y en `/dataset?q=nomina`), así que
  es el total del portal, no el del filtro — un contador que engaña si se lee
  rápido.
- ✅ La búsqueda HTML (`/dataset?q=`) sí es server-rendered y sí pagina (19–20
  por página). Agotada la consulta `nomina` en 9 páginas: **159 conjuntos de
  datos distintos**, frente a las **11 instituciones** que hoy alimentan
  `/nomina`.
- ✅ Cada ficha declara formato (CSV/XLS/ODS), periodicidad, última
  actualización y la **URL de origen en el portal de la institución** — que es
  lo que hace del portal un índice de enlaces directos y no un repositorio.
- ⚠️ La paginación solo responde con `q`: `/dataset?page=61` devuelve cero
  enlaces, coherente con el render en cliente que ya señalaba §4.4.
- ✅ Organizaciones paginadas de 20 en 20, con ayuntamientos, ministerios y
  descentralizadas. Su `/api/` sigue vetado por su propio robots (`Crawl-Delay: 10`,
  respetado en esta pasada).

**Ampliar `/nomina` más allá de las 11 instituciones actuales es hoy trabajo de
manifiesto, no de ingeniería: el índice ya ofrece 159 candidatos.**

### A.9 311 — lectura pública, y un hallazgo de seguridad que reportar

- ✅ El Directus del 311 (`directus-dev.311.gob.do/items/statistics_documents`)
  **responde sin autenticación**: catálogo de documentos estadísticos por año y
  carpeta (`statistics_documents`, `statistics_folders`, `statistics_years`).
  Valor moderado: son PDF, no series.
- ⚠️ **Hallazgo de seguridad**: el bundle de cliente de `311.gob.do/estadisticas`
  publica un **token de Directus en claro** junto a la configuración del portal.
  No lo usamos ni lo registramos aquí. Corresponde reportarlo a la OGTIC por el
  canal de divulgación responsable que el propio Estado publica; conviene
  señalar también que el portal de producción consume un host llamado
  `directus-**dev**`.

### A.10 Verificados de menor calado (estado de campo)

| Fuente | Estado | Nota |
|---|---|---|
| Transparencia Fiscal | ✅ | Su valor real es la API del SIGEF (§A.1); la página solo la construye |
| Crédito Público · Consultoría · DGCP · SIL Diputados | ✅ | **Re-verificadas: las cuatro integraciones vivas responden 200 hoy** |
| TSS | ⚠️ | WP abierto y `wp-json` activo, pero los boletines (Panorama Laboral, recaudo) no cuelgan archivos del HTML; requiere recon dedicada |
| Contraloría | ⚠️ | WP vivo; las rutas de nómina probadas dan 404 y su `wp-json` no responde a búsqueda |
| INDOTEL | ⚠️ | Estadísticas en PDF sueltos |
| Poder Judicial (`transparencia.`) | ⚠️ | 200, robots abierto salvo `/reportePDF/`; sin datos estructurados en portada |
| Tribunal Constitucional | ⚠️ | Sin robots; `/sentencias/` da 404 — la ruta real está por hallar |
| Superintendencia de Bancos | ⚠️ | `apis.sb.gob.do` vivo (404 JSON en raíz), `/swagger` **403**: clave requerida |
| Aduanas (DGA) | ⚠️ | `servicios.aduanas.gob.do/public` responde; estadísticas de comercio exterior sin ruta estable hallada |
| Organismo Coordinador (energía) | ⚠️ | `apps.oc.org.do` sirve reportes ASPX de generación programada vs. real; el de hoy respondió «sin datos para la fecha» |
| ProDominicana, MT, PGR, SNS, MINERD, SISALRIL | ⚠️ | Portales vivos; publicaciones en PDF, sin series legibles por máquina |
| Observatorio de Servicios Públicos | ❌ | `observicios.gob.do/back/api/` exige autenticación (401/405) |

---

### A.11 Cuenta Única (OGTIC) — ⚠️ identidad ciudadana por OIDC, cliente por solicitud (añadido 2026-09-02)

No es una fuente de datos: es la **identidad digital ciudadana** del Estado, y
resuelve lo que §B.3 y PLAN-DEMOCRACIA §6 daban por cerrado (probar que
detrás de un voto hay una persona real y única) sin tocar el padrón.

- ✅ `https://auth.cuentaunica.gob.do/.well-known/openid-configuration` es un
  Ory Hydra público: `authorization`/`token`/`userinfo`/`jwks` (2 claves RSA
  RS256), PKCE `S256`, `token_endpoint_auth_methods` con `none` (cliente
  público sin secreto), scopes `openid`/`offline`, `claims_supported: [sub]`,
  `subject_types: public`. `robots.txt` → 404.
- ❌ Sin `registration_endpoint`: el `client_id` lo emite la OGTIC a mano.
  **Bloqueo institucional, no técnico.** Solicitud redactada en
  PLAN-DEMOCRACIA §9.4.
- ⚠️ Los claims que recibe un tercero (¿viaja la cédula en `userinfo`?) no se
  pueden verificar sin cliente; el registro público
  (`github.com/ogticrd/cuenta-unica-registry`) sugiere `preferred_username`.
- ⚠️ El flujo VID devuelve solo `state`, sin aserción firmada: la identidad
  la da el token OIDC, VID solo añade prueba de vida.
- ❌ Supabase Auth no acepta emisores OIDC genéricos → Cuenta Única se acopla
  encima de la sesión, verificado en una Edge Function (PLAN §9.2).

Diseño, invariantes y pasos del dueño: PLAN-DEMOCRACIA §9.

### A.12 DGCP `/proveedores` — el registro se consulta, no se recorre (añadido 2026-09-03)

Reconocimiento hecho al construir el índice `/proveedores`. Comprobado contra
el servidor con el UA identificable, GET y pocas peticiones:

- ✅ **Censo**: **127,896 proveedores inscritos** (`totalResults` con
  `limit=1`). Es un censo que declara el origen: sí puede ser denominador.
- ✅ **Orden**: por `rpe` **ascendente**. La página 1 son las inscripciones más
  antiguas (`rpe` 1…1070), no las recientes. El `rpe` no es contiguo.
- ✅ **Filtros que la API honra**: `rpe` y `numero_documento` —RNC de 9 dígitos
  o cédula de 11—. Ambos **exactos**: un prefijo (`10187`) devuelve 0. Ambos
  responden en 1–4 s. El registro guarda las cédulas rellenadas con ceros a la
  izquierda (`00200083343`), así que la consulta prueba también esa forma.
- ⚠️ `estado`, `provincia` y `region` son nombres que el servidor **reconoce**
  pero devuelven **500 con cualquier valor probado** (`Activo`, `ACTIVO`,
  `activo`, `Inactivo`, `1`, `SANTIAGO`, `01`, `OZAMA`). Inservibles: no hay
  forma de listar «los proveedores activos de Santiago».
- ❌ **No hay búsqueda por razón social**: `razon_social`, `proveedor`,
  `nombre`, `q`, `rnc`, `documento`, `mipyme`, `provee`, `clasificacion` y
  `forma_juridica` se **ignoran en silencio** (devuelven el registro entero con
  `totalResults` intacto). El silencio es lo peligroso: parece que filtró.
- ❌ **El registro no se puede recorrer entero.** Hay páginas que devuelven
  **500 de forma permanente**, reproducido dos veces cada una: con `limit=200`
  las páginas 11 y 12 (registros 2001–2400) y **toda la cola** (639–640); con
  `limit=1000` la página 3; con `limit=50` la cola entera (2553–2558). No es un
  límite de profundidad —la página 300 de 640 responde bien—: son registros que
  rompen la serialización del origen. Y `limit=1000` tarda 10–50 s por página:
  128 páginas no son lectura en vivo ni con caché diario.

**Consecuencia de diseño, ya aplicada en `/proveedores`** (`lib/dgcp.ts`:
`buscarProveedores`, `muestrearProveedores`, `getProveedorPorDocumento`):

1. La búsqueda **exacta** (RPE, RNC, cédula) va contra el **registro completo**
   y es la vía que hay que ofrecer primero.
2. La búsqueda **por nombre** no puede ir contra el registro, así que va contra
   la **ventana de contratos recientes agregada por RPE** — la misma muestra que
   alimenta `/contratos`, con la que comparte caché— y la interfaz declara esa
   base junto al resultado.
3. **No se construye instantánea del padrón de proveedores.** Un barrido con
   huecos permanentes no da un censo fiable, y un censo a medias mentiría peor
   que la ausencia. Si algún día hiciera falta el padrón completo, la vía es el
   RNC de la DGII (§A.2), no este endpoint.

## B. Bloqueos confirmados

### B.1 Sin cambios desde la primera pasada
- ❌ **ONE / ANDA** — challenge Cloudflare al UA honesto (403). Su robots
  **permite** `*`: el bloqueo es del WAF, no de la política.
- ❌ **Cámara de Cuentas** — HTTP **470** en `www.` y en el ápex. Las
  declaraciones juradas siguen fuera de alcance.

### B.2 Nuevos bloqueos mapeados
- ❌ **911** (`911.gob.do`) — HTTP 470, el mismo patrón de la Cámara de Cuentas.
- ❌ **Migración** — challenge Cloudflare.
- ❌ **SIMV** (valores) — challenge Cloudflare.
- ❌ **SIPEN** — falla TLS: certificado con **clave demasiado débil** para el
  cliente actual. Es configuración del servidor, no bloqueo.
- ⚠️ **Ministerio de Trabajo** — `www.` es rechazado por la política de egreso
  de este entorno; **`mt.gob.do` (sin `www`) sí responde**.

### B.3 JCE — el retroceso
- ✅ El sitio de resultados 2024 responde y lista los documentos por
  `EntryId`.
- ❌ **La descarga responde con un CAPTCHA de Zenedge** («¿Eres humano?») tras
  media docena de peticiones. No se evadió y no se insistió. El archivo
  electoral requiere vía institucional (Ley 200-04) o el repositorio impreso
  (sus estadísticas se publican en Issuu, no en datos).

### B.4 Nómina individual (Portal Único de Transparencia)
Sin cambios: el tablero Power BI sigue sin vía servidor. Se confirmó además que
el `wp-json` del Portal Único **no expone directorio de instituciones** (282
rutas, todas de plugins): no hay atajo por ahí. La vía sigue siendo §A.8.

### B.5 Límite del entorno, no de las fuentes
El navegador headless (Chromium + Playwright, preinstalados) **no puede
navegar**: toda petición muere en `ERR_CONNECTION_RESET` a través del proxy,
incluso contra `example.com`. Todo lo que exija ejecutar JS —índice de archivos
del BCRD, tableros Power BI, SPAs con API firmada— queda fuera de alcance
**desde este entorno**, no necesariamente desde producción.

---

## C. Qué habilita esta pasada (capacidades, no fuentes)

1. **«¿En qué gasta el Estado?»** — vertical de finanzas públicas con ejecución
   mensual por institución, concepto y finalidad (§A.1), junto al indicador de
   deuda que ya existe.
2. **«¿Hubo competencia?»** — ofertas por proceso (§A.3): oferente único,
   concurrencia repetida, ofertas descartadas.
3. **«¿Quién es este proveedor?»** — perfil con RNC, forma jurídica, registro
   mercantil, MIPYME, provincia (§A.3) y, cruzado con la DGII, antigüedad y
   actividad declarada (§A.2).
4. **«¿Qué va a comprar el Estado?»** — PACC (§A.3): señal anticipada, meses
   antes de la licitación.
5. **«¿La obra existe y avanza?»** — proyecto ↔ contrato ↔ territorio (§A.4).
6. **«¿Cuánto cuesta la gasolina esta semana?»** — indicador semanal (§A.5).
7. **«¿Qué tan bien gestiona esta institución / mi ayuntamiento?»** — SISMAP y
   SISMAP Municipal (§A.7).
8. **Nómina de 11 a ~74 instituciones** (§A.8).

---

## D. Plan de integración revisado

Las fases 1 y 2 (deuda, normativa) siguen implementadas. Estas se ordenan por
**valor ÷ esfuerzo**, y todas caben en la arquitectura sin BD:

| Fase | Qué | Esfuerzo | Notas de arquitectura |
|---|---|---|---|
| **5** ✅ | **DGCP: `/ofertas`, `/proveedores`, `/catalogo`, `/pacc`** | **bajo** | Mismo host, mismo `dgcpFetch`, mismas ventanas de caché. Es la mejor relación valor/esfuerzo de toda la auditoría |
| **6** ✅ | **SIGEF: `lib/fiscal.ts` + vertical de finanzas públicas** | medio | `unstable_cache` diario, consulta **por institución**, timeout ≥120 s, precalentar el mes vigente, degradar al mes cerrado anterior |
| **7** | **MICM: indicador de combustibles** | bajo | Portada + título del último aviso; declarar que son 4 precios, no el aviso completo |
| **8** | **MapaInversiones: obra pública** | medio | CSV grandes → instantánea en build (patrón nómina), unión por `codigo_snip` con procesos |
| **9** | **RNC (DGII) en fichas de proveedor** | medio | Instantánea en build restringida a los RNC presentes en compras; nunca descarga en request |
| **10** | **Nómina ampliada (159 candidatos) + SISMAP** | bajo | Añadir líneas al manifiesto de `scripts/build-nomina.py`; SISMAP es parseo de tabla |
| **11** | BCRD (tipo de cambio) | bajo | Solo si el XLS del CDN se parsea sin dependencia pesada; el resto de series, tras pedir el índice |

**Regla que impone la fase 6**: la plataforma necesita una segunda clase de
adaptador — *fuente lenta, consolidada en instantánea* — junto a la actual
*fuente viva, cacheada por minutos*. Al implementarla se midió que ni el caché
por día alcanza: una sección entera del SIGEF tarda **97 s** y una institución
suelta entre 20 y 90 s, por encima de lo que aguanta cualquier función de
servidor. `scripts/build-fiscal.py` resuelve las tres secciones en tres
llamadas y `lib/fiscal.ts` sirve el resultado; el precedente era la nómina.

**Semántica del SIGEF que es fácil leer mal** (verificada fila a fila al
implementar, y documentada en el script): `PRESUPUESTO INICIAL` solo aparece en
el mes 1; `PRESUPUESTO VIGENTE` **no es un saldo sino un delta mensual** —el
mes 1 trae la apertura y los demás las modificaciones, con signo—, así que el
vigente real es la suma del año. Sumar mal ahí no da un error visible: da una
cifra creíble y falsa. Y el mes en curso llega con filas a cero, de modo que el
corte honesto es el último mes con devengado real, no el último mes con filas.

---

## E. Reglas nuevas que deja esta pasada

1. **La vitrina no es la fuente.** Transparencia Fiscal no publica datos:
   publica un formulario que llama a una API que nadie documenta. El hallazgo
   más grande de esta auditoría estaba en el JavaScript de una página que la
   primera pasada dio por «mapeada».
2. **Un 403 en la puerta no cierra la casa.** La DGII bloquea su consulta web y
   a la vez publica su padrón completo en un ZIP estático.
3. **Antes de buscar una fuente nueva, agotar la que ya se integró.** Cuatro
   endpoints útiles llevaban meses a un `GET` de distancia.
4. **La latencia es parte del contrato.** Una API que tarda 90 s en el mes
   corriente y 0.4 s en un año cerrado obliga a diseñar la caché antes que la
   feature.
5. **Nunca usar una credencial filtrada** (§A.9), aunque esté a la vista y
   aunque el dato sea público: se reporta, no se aprovecha.
6. **Publicar no es exponer.** Que un registro público traiga teléfonos y
   correos no obliga a mostrarlos (§A.3).
7. **Declarar la cobertura, siempre.** 4 precios de combustible no son «los
   precios»; 11 nóminas no son «la nómina»; una muestra del SIL no es el SIL.
8. **Desconfiar del contador ajeno.** datos.gob.do rotula «1,206 resultados
   encontrados» busques lo que busques: la cifra real se obtiene paginando.

---

## F. Pendientes, en orden

1. **Fase 5** (endpoints DGCP) — ejecutable ya, sin decisiones previas.
2. **Fase 6** (SIGEF) — decidir la ventana de caché y el conjunto de
   instituciones a precalentar en el panorama.
3. Reportar a la OGTIC el token expuesto del 311 (§A.9).
4. Pedir al BCRD el índice de archivos por sección (§A.6), o resolverlo desde
   un entorno con navegador.
5. Recon dedicada: TSS (boletines), Aduanas (comercio exterior), Tribunal
   Constitucional (sentencias), Organismo Coordinador (generación diaria).
6. Solicitudes institucionales, en paralelo y de plazo largo: ONE (lista
   blanca), Cámara de Cuentas y 911 (Ley 200-04), JCE (archivo electoral).
7. Verificar desde el egress de producción lo que este entorno no puede:
   TLS de `www.poderjudicial.gob.do` y de SIPEN, y el navegador headless (§B.5).
8. **Solicitar a la OGTIC el cliente OAuth2 de Cuenta Única** (§A.11,
   PLAN-DEMOCRACIA §9.4). Cabe en el mismo oficio que el reporte del token
   del 311 (§A.9).
