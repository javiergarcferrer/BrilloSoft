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
| Macro | Banco Central | Inflación, IPC, tasas, sector real/externo | API oficial (swagger) | ⚠️ credenciales |
| Macro | ONE / ANDA | Censos, encuestas, microdatos | — | ❌ WAF Cloudflare |
| Fiscal | Crédito Público | Deuda SPNF mensual (saldo, evolución, desembolsos) | **XLSX URL predecible** | ✅ |
| Fiscal | Transparencia Fiscal | Ejecución de ingresos/gastos/financiamiento, datos abiertos | WP abierto + descargas | ✅ mapear formatos |
| Fiscal | DIGEPRES | Presupuesto, ejecución | WP abierto, PDFs | ⚠️ PDF |
| Fiscal | MapaInversiones | Inversión pública proyecto a proyecto | HTML server-rendered (+API interna) | ✅ mapear |
| Fiscal | DGII | RNC, recaudación | — | ❌ 403; WS móvil retirado |
| Normativa | **Consultoría Jurídica** | **Leyes, decretos, reglamentos, resoluciones, Gaceta** | Consulta MVC (token+POST), PDF por GUID | ✅ |
| Integridad | Contraloría | Nóminas aprobadas, informes | WP abierto | ✅ mapear |
| Integridad | Cámara de Cuentas | Declaraciones juradas, auditorías | — | ❌ WAF (HTTP 470) |
| Integridad | datos.gob.do | Catálogo CKAN | robots prohíbe `/api/` | ❌ marginal (2ª verificación) |
| Electoral | JCE | Resultados por elección, estadísticas | Sitios DNN por comicio | ✅ mapear por elección |
| Judicial | Poder Judicial | Sentencias, estadísticas | `transparencia.` sí responde | ⚠️ TLS roto en `www.` |
| Judicial | Tribunal Constitucional | Sentencias TC | Sin robots | ⚠️ sin mapear |
| Social | TSS | Cotizantes, empleadores (mensual) | WP abierto | ✅ mapear |
| Social | SIPEN | Fondos de pensiones | Cloudflare signals, `*` permitido | ⚠️ sin mapear |
| Social | **PUT (DIGEIG)** | **Nómina estatal individual** + consulta de decretos | Power BI sin API utilizable | ⚠️ vía CSV por institución (§5.9) |
| Admin. | SISMAP | Índices de gestión pública | SPA con API interna | ⚠️ mapear API |
| Finanzas | Superintendencia de Bancos | Series del sistema financiero | `apis.sb.gob.do` vivo | ⚠️ clave |
| Comercio | DGA (Aduanas) | Comercio exterior | Sin robots | ⚠️ sin mapear |

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
