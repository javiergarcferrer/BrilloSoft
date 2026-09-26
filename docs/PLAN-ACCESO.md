# Plan de acceso — que el Estado se recorra solo

**Principio rector:** acceso fácil. Toda pregunta ciudadana se contesta en dos
toques como máximo, y todo dato enlaza con sus parientes: una institución lleva
a su presupuesto, sus compras, su nómina y sus decretos, y de cada uno se vuelve.

Levantado el 2026-09-23 sobre el árbol en `c3b8834`, con tres recorridos del
código (navegación, profundidad por vertical, fuentes pendientes). Cada punto
cita dónde se comprobó. Se marca ✅ cuando se entrega y se mueve a la página
que lo posea; lo que exija una decisión del dueño va a `docs/DECISIONES.md`.

## 1. Diagnóstico — dónde se atasca hoy un ciudadano

1. **Cada vertical es una isla.** El único puente es Congreso → Normativa
   (`components/congreso/dossier.tsx`). `/finanzas/[capitulo]`, `/nomina`,
   `/planes` y `/normativa/[tipo]/[numero]` no enlazan a ninguna otra vertical.
2. **No existe la institución.** El mismo ministerio es una unidad de compra
   (DGCP), un capítulo (`lib/capitulos.ts`) y un código de nómina
   (`lib/nomina.ts`), y nada los une. Es el mayor atasco de la plataforma.
3. **Solo se busca en compras.** El buscador de la cabecera existía únicamente
   en Licitaciones (hoy la cabecera abre siempre la búsqueda global y cada
   vertical lleva su campo en la página). Normativa y Finanzas no tenían
   búsqueda de texto. Quien escribía «MINERD» o «Ley 47-25» no tenía dónde.
4. **Seguir, compartir y alertas son solo de compras.** `lib/seguimiento.ts`
   guarda procesos; `components/compartir.tsx` dice «Mira esta licitación»;
   el RSS (`app/api/feed/route.ts`) es de procesos. No se puede seguir un
   proyecto de ley, que es el caso más natural de «avísame cuando se mueva».
5. **La explicación está escrita y no se ve.** `lib/glosario.ts` (11 términos)
   no lo importa nadie; no hay primitiva de término. Solo compras tiene guía
   (`app/guia`).
6. **Lo que ya está en los datos no se muestra.** Proponentes con
   `legisladorId`, provincia y partido (`lib/congreso.ts:71-78`) sin ficha de
   legislador; `vigente − inicial` y `devengado − pagado` en `fiscal.json` sin
   pintar; oferente único, excepciones y compras fuera del PACC ya traídas en
   `Proceso` sin agregar; provincia del proveedor sin vista territorial.
7. **Estado fuera de la URL y datos viejos sin avisar.** La institución de
   `/nomina` vive en `useState` (no se comparte). La nómina de Defensa Civil es
   de diciembre de 2021 y la de la JAC de marzo de 2026, sin marca visible.

## 2. Horizonte 1 — tejer lo que ya existe (sin fuentes nuevas)

El esqueleto. Nada de esto toca una fuente nueva ni la invariante.

| # | Entrega | Qué resuelve | Hecho cuando |
|---|---|---|---|
| 1.1 ✅ | **Ficha de institución** `/instituciones/[id]` sobre un cruce estático `lib/instituciones.ts` (capítulo SIGEF ↔ unidad de compra DGCP ↔ código de nómina ↔ nombre en la Consultoría), curado a mano y versionado —no es una DB— | Diagnóstico 1 y 2. Una página por institución: presupuesto y ejecución, compras recientes y principales proveedores, nómina, PACC y decretos que la citan (`Institucion` en la instantánea de normativa) | Las 11 instituciones de nómina y los 20 capítulos de mayor gasto tienen ficha; cada vertical enlaza a ella |
| 1.2 ✅ | **Buscador global** `/buscar` y caja en la cabecera de **todas** las secciones | Diagnóstico 3. Enruta por forma: RNC/RPE → proveedor; «Ley 47-20» → ficha de norma; código de proceso → proceso; nombre de institución → su ficha. Si no hay forma, consulta en paralelo DGCP, SIL, títulos de la instantánea de normativa, cargos de nómina e instituciones, y agrupa los resultados por vertical | Las cinco formas enrutan directo; el resto devuelve resultados agrupados con alcance declarado |
| 1.3 ✅ | **Término explicado**: primitiva `<Termino>` (HoverCard de shadcn) sobre `lib/glosario.ts`, ampliado; y guías por vertical: «Cómo nace una ley», «Cómo leer el presupuesto», «Qué es la deuda del SPNF» | Diagnóstico 5. Explicar en el sitio donde se tropieza | Todo término de `glosario.ts` aparece al menos una vez envuelto; tres guías publicadas y enlazadas desde su vertical |
| 1.4 ✅ | **Enlaces de ida y vuelta**: norma → proyecto que la originó; Diputados ↔ Senado para la misma pieza; proceso y capítulo → institución | Diagnóstico 1 | Ninguna ficha es un callejón sin salida. ✅ Lado compras: proceso, `/contratos`, `/estadisticas`, `/planes`, clientes de `/proveedores/[rpe]` y `/licitaciones?uc=` enlazan a la ficha de institución |
| | ✅ **Lado Congreso (2026-09-23):** ley → proyecto de Diputados que la originó y proyectos que la citan (`proyectosDeNorma`, confirmado por número de promulgación); Diputados ↔ Senado por la cita de expediente o, si el Senado la dejó vacía, por la misma ley (`gemeloEnSenado`). ✅ Texto de una pieza → institución: solo por nombre completo de 18 letras o más, sin hospitales ni ayuntamientos (`institucionesNombradasEn`) | `docs/RECON.md` §14.5 | |
| 1.5 ✅ | **Seguir cualquier cosa**: `lib/seguimiento.ts` pasa a tipos (proceso, proyecto, proveedor, institución); `/seguimiento` sale de Licitaciones; «qué cambió desde tu última visita», calculado en el navegador; compartir y RSS en toda ficha | Diagnóstico 4, sin servidor ni cuenta (sigue en `localStorage`) | Se sigue un proyecto de ley y la página marca su cambio de estado |
| 1.6 ✅ | **Estado en la URL y frescura visible**: filtros de `/nomina` en `searchParams`; marca de antigüedad por institución cuando el mes publicado tenga más de 3 meses | Diagnóstico 7 | Un enlace a `/nomina?inst=MSP&cargo=chofer` reproduce la vista; Defensa Civil muestra su fecha |
| 1.7 ✅ | **Portada y navegación**: tarjetas de Normativa y Democracia; buscador en la portada; en el teléfono, «Buscar» y «Seguimiento» como pestañas fijas; `app/sitemap.ts` con las fichas | Diagnóstico 3 y 8 del recorrido: Finanzas y Normativa quedan a dos toques y los buscadores externos no encuentran las fichas | Toda vertical a un toque o una búsqueda desde la portada |

**Entregado (2026-09-23):**

- ✅ **1.3** — `components/termino.tsx` sobre `ui/popover` (no HoverCard: un
  dedo no tiene `hover`; se abre al tocar y con teclado, 44 px de toque sin
  mover la línea). `lib/glosario.ts` pasa de 13 a 42 términos, todos envueltos
  al menos una vez (portadas de vertical, fichas, guías). Guías: `/guia`
  (compras, se queda donde estaba), `/congreso/guia`, `/finanzas/guia` y
  `/finanzas/guia/deuda`, enlazadas desde su vertical (pestaña «Guía» en
  Congreso y Finanzas, tarjeta de deuda) y entre sí (`components/otras-guias.tsx`).
  Solo afirman lo comprobable de la Constitución de 2015 y la Ley 423-06; los
  reglamentos de cámara no se resumen.
- ✅ **1.5** — `lib/seguimiento.ts` con entradas tipadas (proceso, proyecto,
  expediente del Senado, proveedor, institución, norma) y migración de la lista
  vieja de códigos. `/seguimiento` es página de plataforma (pie y paleta), agrupa
  por tipo y marca «qué cambió desde tu última visita» para compras y piezas del
  Congreso; `/api/seguimiento` da la huella de una pieza del Congreso y
  `/api/feed/congreso/[id]` su historial en RSS. Seguir y compartir con texto por
  tipo en las fichas de proceso, Diputados, Senado, proveedor, norma, institución
  (con el RSS de sus procesos nuevos) y capítulo (este solo compartir: es una
  instantánea).
  ⚠️ Proveedores, instituciones y normas se siguen como marcadores, sin
  comparación de estado: no tienen un estado de una línea que cambie.

**Orden recomendado:** 1.1 → 1.2 → 1.3. La ficha de institución es el nodo al
que todo enlaza; el buscador la hace alcanzable; el término explicado la hace
legible. El resto se apoya en esas tres.

**Entregado el 2026-09-23 (horizonte 1).** 1.1: `/instituciones` y
`/instituciones/[id]` sobre `lib/instituciones.ts`; las señales de 2.3 viven en
su bloque «Cómo compra». 1.2: `/buscar` (`lib/buscar.ts`) y la paleta ⌘K como
puerta, con sugerencias de institución por `/api/instituciones` (desde el
2026-09-26, sugerencias de cualquier tipo por `/api/buscar`; ver §6 bis). 1.4: todas las
fichas enlazan a la institución; ley ↔ proyecto ↔ Senado; una pieza enlaza a
las instituciones que nombra por su nombre completo. 1.7: caja de búsqueda y
fila de Instituciones, Normativa y Democracia en la portada; `app/sitemap.ts`.
En el teléfono no se añadió una pestaña «Buscar»: el botón de la paleta en la
cabecera ya es un toque, y quitarle una casilla a una vertical costaba más; la
hoja «Más» lleva las páginas transversales (instituciones, buscar, provincias,
seguimiento).

## 3. Horizonte 2 — mostrar lo que ya está en los datos

| # | Entrega | Datos ya en mano |
|---|---|---|
| 2.1 | ✅ **Fichas de legislador** `/congreso/legisladores/[id]`: qué propuso, cuánto prosperó, por provincia y partido — entregado 2026-09-23 con directorio `/congreso/legisladores`, voto nominal por diputado y `/congreso/votaciones/[id]` con el voto de los 190 | `legislador/*` y `votacion/*` verificados en `docs/RECON.md` §14 |
| 2.2 ✅ | **Finanzas legible**: buscar, ordenar y filtrar capítulos; «quién ganó o perdió presupuesto en el año» (`vigente − inicial`); «a quién se le debe» (`devengado − pagado`); ranking de ejecución | `public/data/fiscal.json` |
| 2.3 ✅ | **Señales por institución en compras**: tasa de oferente único, compras por excepción o emergencia, procesos fuera del PACC | `oferenteUnico`, `tipo_excepcion`, `adquisicion_planeada` en `lib/dgcp.ts` |
| 2.4 | ✅ **Territorio** `/provincias/[slug]`: proveedores del Estado y legisladores de la provincia; más tarde, obras (3.1) | Provincia en `ProveedorRegistro` y en los proponentes. Entregado: `lib/provincias.ts`; el registro no filtra por provincia (500), así que es la muestra declarada de los 200 mayores adjudicatarios de la ventana; ayuntamientos solo los ciertos (cabecera + municipios de Santo Domingo); legisladores por enlace a `/congreso/legisladores?provincia=` |
| 2.5 ✅ | **Nómina comparada**: el mismo cargo entre instituciones y los puestos mejor pagados del Estado | Filas de `public/data/nomina.json` |
| 2.6 | ✅ **Normativa buscable**: texto sobre los títulos; designaciones del mes por cargo | Instantánea de normativa. Entregado: `/normativa?q=` (número y título del tipo y año, en vivo o instantánea) y «Designaciones del mes» (etiqueta «Cámara de Cuentas», cargo leído del título, declarado) |
| 2.7 ✅ | **Descargar**: CSV en finanzas, contratos, normativa y congreso; en licitaciones, el barrido entero y no solo la página | Lo que cada página ya calcula. Hecho: licitaciones (`/api/procesos/csv`, el barrido de hasta 6000), contratos (`/contratos/csv`, la muestra) y normativa (`/normativa/csv`), finanzas (la tabla filtrada, en el navegador) y congreso (`/congreso/legisladores/csv`, el directorio; `/congreso/votaciones/[id]/csv`, el voto nominal) |
| 2.8 ✅ | **Deuda en el tiempo**: serie, no tres cifras sueltas | Entregado en `/deuda` con lo que el origen conserva: cierre anual desde 2000 con % del PIB y trimestral desde 2015 (los meses intermedios de años pasados ya no están publicados; ver `docs/AUDITORIA.md` §3.3) |

**Entregado (2026-09-23).** 1.6: `/nomina?inst=MSP&cargo=chofer&vista=comparar`
reproduce la vista (`q`, `inst`, `cargo`, `vista` en la URL); CESAC, JAC y
Defensa Civil llevan la marca ocre «foto de hace…». 2.2: búsqueda, sección y
cuatro órdenes en `/finanzas`, tres rankings y CSV de la tabla filtrada (la
parte de finanzas de 2.7); cada capítulo lista sus unidades de compra. 2.5:
pestaña «Comparar» con la mediana por institución de un cargo normalizado y
los 15 puestos mejor pagados, declarando las 11 instituciones. 2.8: `/deuda`.

## 4. Horizonte 3 — fuentes nuevas ya verificadas

Del plan de fases de `docs/AUDITORIA.md` §D, ordenadas por valor ciudadano
entre esfuerzo. Todas respetan la invariante (sin llave, instantánea en build).

1. **MapaInversiones** (§A.4, fase 8): obra ↔ SNIP ↔ proceso ↔ proveedor ↔
   territorio, con avance físico y financiero. `Proceso` ya trae `codigo_snip`.
   Responde «¿existe la obra y avanza?» y alimenta 2.4.
   ✅ 2026-09-23: `/obras` (filtros por estado, provincia, institución y texto)
   y `/obras/[snip]`, `lib/obras.ts` sobre `scripts/build-obras.py`; enlazada
   desde la ficha de proceso (`ObraDelProceso`) y la de institución
   (`ObrasDeInstitucion`). El avance físico y el financiero son el mismo número
   en la fuente: se muestra uno, declarado. Cada `/provincias/[slug]` lista sus
   obras (con el alias «Baoruco» → Bahoruco), y `/buscar` las encuentra.
2. **Padrón RNC de la DGII** (§A.2, fase 9): actividad, estado y fecha de
   inicio del proveedor; hace comprobable «empresa creada semanas antes de
   ganar». Instantánea acotada a los RNC que aparecen en compras.
   ✅ 2026-09-23: `lib/rnc.ts` + `scripts/build-rnc.py`; la lista de RNC sale
   de la tabla completa del RPE, que la DGCP sí sirve como archivo (AUDITORIA
   §A.12, añadido). `FichaRnc` en `/proveedores/[rpe]` dice actividad, estado,
   régimen e «inició operaciones N días antes de su primer contrato».
3. **Nómina por datos.gob.do** (§A.8, fase 10): de 11 a decenas de
   instituciones; trabajo de manifiesto en `scripts/build-nomina.py`.
   ✅ 2026-09-23: 22 instituciones y 28,720 plazas (antes 11 y 13,668; corregido tras la segunda revisión: ver AUDITORIA §A.8); los
   códigos nuevos están atados a su ficha en `scripts/build-instituciones.py`
   salvo el Poder Judicial, que no tiene unidad de compra. Descartes y
   bloqueos en AUDITORIA §A.8.
4. **SISMAP y SISMAP Municipal** (§A.7, fase 10): calidad de gestión por
   institución y por ayuntamiento; tablas HTML, lo más barato.
   ✅ 2026-09-23: `/gestion` (instituciones, ayuntamientos y juntas de distrito,
   con búsqueda) y `SismapDeInstitucion` en la ficha; `lib/sismap.ts` sobre
   `scripts/build-sismap.py`. El SISMAP no publica fecha de corte: se declara
   el día de la consulta.
5. **Combustibles del MICM** (§A.5, fase 7) y **tasa del BCRD por CDN**
   (§A.6, fase 11): indicadores del bolsillo en la portada.
   ✅ 2026-09-23, en la portada debajo de la deuda: `lib/combustibles.ts` y
   `lib/tasa.ts`, en vivo con caché de 1 h;
   `<SeccionBolsillo />` de `components/fuentes-nuevas/indicadores-bolsillo.tsx`
   trae los dos con su `Suspense`. La tasa sale del `.xlsx` del CDN: el `.xls`
   que citaba la auditoría está congelado desde 2022.

## 4 bis. Horizonte 3b — la tercera pasada (2026-09-24)

Barrido del Estado entero en seis frentes (`docs/AUDITORIA.md` §G). Entregado:

- ✅ **Historia de las compras desde 2015** (`/historico`, §G.1): 722,825
  contratos y 631,103 procesos agregados por año, institución y proveedor; cada
  ficha de institución y de proveedor lleva su bloque «desde 2015».
- ✅ **Biblioteca del Estado** (`/documentos`, §G.2): 18,726 documentos de 22
  instituciones, buscables por título; «Lo que publica» en la ficha.
- ✅ **Catálogo de datos abiertos** (`/datos`, §G.3): todo datos.gob.do.
- ✅ **Sentencias del Tribunal Constitucional** (`/constitucional`, §G.6).
- ✅ **Panorama ampliado**: remesas, reservas y tasa activa (BCRD), comercio
  exterior (Aduanas), la luz de ayer (OC), alertas del tiempo (INDOMET) y
  muertes en las vías (OPSEVI).
- ✅ **Nómina ampliada** de 22 a 86 instituciones (94,659 plazas) por la vía de
  §A.8; y la nómina general del MAP (492,488 plazas, 125 instituciones) en
  `/nomina/general`, agregada en el servidor (§G.10).

Siguiente, por valor ÷ esfuerzo: §G.9.

## 5. Horizonte 4 — lo que solo desbloquea el dueño

Gestiones institucionales, ya listadas en `docs/DECISIONES.md` y
`docs/AUDITORIA.md` §F: el permiso de Cloudflare de la Consultoría (§4.1), ONE,
Cámara de Cuentas (declaraciones juradas: el eslabón persona ↔ patrimonio),
JCE, 911 y el cliente de Cuenta Única. Ninguna sesión las gestiona; cada una
deja preparados los pasos.

## 6. Decisiones que este plan abre (van a `docs/DECISIONES.md` al tocarlas)

- **Notificaciones push** del seguimiento: exigen guardar suscripciones en un
  servidor, lo que rompe la invariante fuera de `/democracia`. Hasta que el
  dueño decida, el aviso es RSS y «qué cambió» al volver.
- **Instantáneas al día sin sesión humana**: una rutina programada que
  regenere normativa (semanal), deuda y fiscal (mensual) y entregue por el
  gate. Consume sesiones en la nube; lo aprueba el dueño.

## 6 bis. Bibliotecas abiertas en vez de código propio (auditoría 2026-09-26)

Criterio: si una biblioteca madura, sin clave ni servicio, hace lo que un
archivo de `lib/` hace a mano, se usa la biblioteca (shadcn es el
precedente). Ninguna de estas rompe la invariante.

- ✅ **Buscador de toda la plataforma** — `/buscar` y la paleta pasan de
  «todas las palabras como subcadena, por vertical» a un índice con ranking:
  Orama (BM25, raíces del español, erratas) + Model2Vec (tema) fundidos por
  RRF; filtros por tipo con su cuenta, vista «Todo» por grupos, palabras en
  negrita, «Por tema» declarado (`docs/ARQUITECTURA.md` §Búsqueda).

Pendiente, por valor ÷ esfuerzo (archivo:línea verificados el 2026-09-26):

1. **ZIP/XLSX a mano** — `lib/deuda.ts:94-122` lee el tamaño de la cabecera
   local del ZIP: un XLSX escrito en streaming (tamaño 0 + descriptor) deja
   la fuente muda sin error; ZIP64 no se lee. Tres lectores de hoja por regex
   (`deuda.ts:158-190`, `tasa.ts:79-100`, `aduanas.ts:222-260`) ignoran
   `inlineStr` y texto enriquecido. → `fflate` (`unzipSync`, directorio
   central) y `read-excel-file`.
2. **Entidades HTML, nueve copias que discrepan** (`tc.ts:117`, `tse.ts:123`,
   `cortes.ts:154`, `senado.ts:203`, `deuda.ts:374`, `aduanas.ts:211`,
   `alertas.ts:79`, `combustibles.ts:43`, `macro.ts:133`): varias solo
   conocen `&amp;` y dejan `&eacute;` sin decodificar. → `entities`.
3. **HTML por regex** (`tc.ts:136-170`, `tse.ts:160-190`, `senado.ts:313,
   416, 567-584`): un cambio de comillas en el portal reduce filas en
   silencio. → `node-html-parser` (solo servidor).
4. **fetch + timeout + un reintento, ~12 copias** (`dgcp.ts:128`,
   `congreso.ts:109`, `siniestralidad.ts:49`, …): el contrato de
   `.claude/rules/fuentes.md` escrito doce veces con diferencias. → `ky` o
   un `lib/pedir.ts` propio.
5. **JSON externo con `as T`** (`dgcp.ts:138`, `congreso.ts:134`,
   `normativa.ts:168`, `banca.ts:80`, …): un campo renombrado llega como
   `undefined` a la interfaz en vez de degradar a `null`. → `zod` (o
   `valibot` para `lib/seguimiento.ts`, que viaja al navegador).
6. ✅ **URL ↔ estado, tres mecánicas** (`app/buscador.tsx`,
   `components/nomina/explorer.tsx`, `components/campo-licitaciones.tsx`,
   `components/buscador-url.tsx`). → `nuqs`. Hecho 2026-09-26: un mapa de
   parámetros compartido (`components/licitaciones-url.ts`), mismos nombres y
   valores en la URL; `desde=` vacío pasa a escribirse («todo el histórico»
   no sobrevivía a recargar) y un enlace con `page=` ya no se reinicia al
   abrir.
7. ✅ **Virtualización con alto fijo** (`components/nomina/data-table.tsx`).
   → `@tanstack/react-virtual` con filas medidas; reordenar vuelve arriba.
8. ✅ **Arrastre de la hoja** (antes `components/ui/sheet.tsx`). → `vaul`:
   `components/ui/drawer.tsx`, que usan la hoja de filtros y la de «Más»;
   `ui/sheet` ya no se usa y salió del repositorio.
9. **Fechas**: nueve tablas de meses en español. → `Intl.DateTimeFormat`
   (sin dependencia).

Del buscador, lo siguiente:
- **Índice de Orama persistido** (`@orama/plugin-data-persistence`): el
  arranque en frío baja de ~2 s a ~0.5 s a cambio de ~25 MB más en el
  repositorio por regeneración. Medido; no se hizo por ese peso.
- **Proveedores (padrón RNC) en el índice**: hoy solo por RNC exacto o en su
  vertical.
- **Tema con contexto**: un modelo de frases (p. ej. `multilingual-e5-small`
  en ONNX) entendería «quién audita las cuentas»; exige ejecutar una red en la
  función (~120 MB, onnxruntime). Solo si el estático se queda corto en uso.

## 7. Guardarraíles para quien ejecute

- Nada de esto introduce DB ni variables de entorno: los cruces son archivos
  versionados, el seguimiento vive en el navegador.
- Cada ficha nueva usa las primitivas de `docs/IDENTIDAD.md` §8 y declara su
  fuente y su fecha; toda vista con datos parciales lo dice (el patrón de
  «muestra» de `/licitaciones`).
- El buscador global declara su alcance por vertical; no promete lo que no
  consulta.
- Cada entrega pasa por el gate y actualiza esta página (✅) y `/fuentes`
  cuando toca una fuente.
