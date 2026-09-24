# Socrático — identidad «El Contrasello»

Fuente de verdad del diseño. Si algo en la interfaz contradice este documento,
la interfaz está mal. Los tokens viven en `app/globals.css`; aquí está el
**porqué** y las reglas que no se negocian.

## La idea

En el país del sello y la firma, un sello que no aprueba nada: pregunta.
La identidad toma el vernáculo del documento oficial dominicano —el papel, la
tinta, el sello, la firma— y lo pone del lado del ciudadano. **Nada imita lo
oficial; todo lo interroga.**

De ahí sale la prohibición central: **la credibilidad viene del papel, no del
brillo**. Esta plataforma no se parece a una app; se parece a un expediente
bien compuesto.

## Prohibiciones (esto es lo que se incumplió antes)

1. **Sin degradados.** Ni de fondo, ni de texto, ni manchas difuminadas
   (`blur-3xl`, `bg-gradient-*`). Un panel oscuro es tinta plana.
2. **Sin sombras de vidrio.** El papel no flota. Las superficies se separan
   con **filete** (`border-hairline`), no con `shadow-*`. `shadow-card` y
   `shadow-soft` quedan reservados a lo que de verdad se superpone: menús,
   hojas modales, el botón flotante.
3. **Esquinas contenidas.** `rounded-lg` (8px) como máximo en superficies;
   `rounded-full` solo en puntos, sellos y avatares. Nada de `rounded-2xl`
   ni `rounded-3xl`: una tarjeta con esquinas de app rompe la metáfora.
4. **Sin emoji** y sin iconos decorativos. Los iconos son de trazo, 16/20/24.
5. **Sin escudo ni bandera.** Somos independientes; parecer oficial sería
   mentir.
6. **Sin blanco de pantalla.** Sobre tinta y sobre relleno saturado el texto es
   `canvas` —papel, cálido—, nunca `white`. La primitiva `Accion` ya lo había
   decidido; el árbol había derivado a 71 usos de blanco contra 19 de papel.
7. **Nada de píldoras.** `rounded-full` con relleno horizontal real (`px-2` o
   más) es una marca o un botón vestidos de app. Un sello no tiene esquinas
   redondas: la marca va `rounded-md`, el botón `rounded-lg`, la barra de
   progreso `rounded-sm`. El punto, el sello, el avatar y la burbuja de conteo
   (`px-1`) se quedan redondos.

## Color — papel, tinta, sello, firma

| Token | Valor | Oficio |
|---|---|---|
| `canvas` | `#F7F3EA` | Papel de oficio. El fondo de todo. |
| `surface` | `#FDFBF5` | La hoja sobre el papel: tarjetas y paneles. |
| `ink` | `#171D2E` | Tinta de imprenta. Texto y bandas oscuras. |
| `ink-soft` | `#555B6B` | Grafito: texto secundario, anotación al margen. |
| `hairline` | `#DED6C6` | La raya del folio. Separa **todo**. |
| `brand-*` | `#35519C` y escala | **La firma**: azul de bolígrafo. Todo lo accionable. |
| `sello-*` | `#A63A2A` y escala | **El sello**: la marca. Escaso por definición. |
| `alerta-*` | ocre | Advertencia, plazo, perención. |
| `valido-*` | verde archivo | Lo ya cumplido: promulgada, vigente, adjudicado. |
| `v-*` | tintas apagadas | Matiz por vertical. Solo orienta, nunca colorea contenido. |

**Por qué `brand` es la firma y no el sello:** el token de marca colorea
enlaces, botones y estados activos — cientos de apariciones. Si fuera rojo, el
sello estaría en todas partes y dejaría de pesar. *El sello aparece poco, y por
eso pesa.*

Dónde sí va el sello: el acento del logotipo, el punto de la «¿», la vertical de compras,
lo que **deroga**, y el punto del rótulo. En ningún otro sitio sin motivo.

## Tipografía — tres familias, tres oficios

- **Instrument Serif** (`font-display`) — *la pregunta*. Titulares de página
  (h1) y de sección grande. Peso 400 siempre: es serif, no necesita negrita.
- **Public Sans** (`font-sans`) — *la explicación*. Cuerpo, interfaz,
  etiquetas, botones. La letra del estándar web de gobierno, puesta a servir
  al ciudadano.
- **IBM Plex Mono** (`font-mono`) — *el registro*. Montos, códigos,
  expedientes, fechas, porcentajes: todo lo que se copia y se verifica. Y la
  clase `.rotulo`: versalitas espaciadas que encabezan una sección, como el
  epígrafe de un formulario.

Regla de reparto: **si es una pregunta o un titular, serif; si es un dato que
se verifica, mono; todo lo demás, sans.** Un título de panel pequeño (14px) es
sans en negrita, no serif: la serif a ese tamaño se lee floja.

## La marca — «socrático», el acento es el sello

`components/marca.tsx`. Desde el 2026-09-24 (decisión del dueño) la marca es
una sola palabra en minúscula, **sin «.do»**: el nombre es Socrático.

- `Logotipo` — «socrático» en Instrument Serif; **el acento de la «á» es el
  sello**, un trazo rojo inclinado (`bg-sello-600`; `bg-sello-300` sobre tinta).
  Cabecera y pie.
- `SelloCompacto` — la «s» con el mismo acento en una placa (SVG): cabecera
  en teléfono, favicon (`app/icon.svg`), ícono de la app. Sobre tinta el acento
  se aclara.
- `Sello` — la circular con «¿» al centro y el aro «SOCRÁTICO · PREGÚNTALE AL
  ESTADO · REPÚBLICA DOMINICANA». Es el sello de firma (pie de página, tarjeta
  social), no el logotipo. Nunca por debajo de 72 px con aro.

**La marca roja es el sello.** El acento del logotipo y del ícono, el punto de
la «¿» y el punto del rótulo van en rojo. Es la regla única y no admite
excepción. Lo patrio está en la paleta —azul de firma, rojo de sello, papel—, nunca
en la bandera ni el escudo: la herramienta es independiente y no oficial.

## La voz

1. **Pregunta, no acusa.** Los titulares son preguntas; los datos responden.
   La conclusión la saca el lector. La pregunta vive en los titulares de
   página, no en la cabecera: desde el 2026-09-23 (decisión del dueño) la
   cabecera es un megamenú de sustantivos —Dinero público, Leyes, El Estado—
   donde cada destino lleva debajo una línea que dice qué hay (`lib/menu.ts`).
2. **Cita la fuente o no lo dice.** Cada cifra lleva origen y fecha. Lo que la
   fuente niega, se declara negado.
3. **Español llano primero.** «Perimió» se explica antes de usarse.
4. **El documento entero, siempre.** Nada se resume sin dejar el original al
   lado. Leer es el derecho; explicar es la ayuda.

## Ergonomía cognitiva

> La lente, prestada de la doctrina de UI de RosetSoft
> (`docs/engineering-lenses.md` §2): **¿qué tiene que sostener el lector en la
> cabeza que la aplicación podría haber sostenido por él?**
>
> El ciudadano no estudia esta plataforma: la *consulta*, en el teléfono, entre
> otras dos cosas. Cada unidad de memoria de trabajo que le gastamos es una que
> no tiene para lo que vino a hacer.

Cuando ciudadano y periodista quieren cosas opuestas, **manda el ciudadano**:
por defecto se muestra poco y explicado, y la densidad se despliega bajo
demanda. El periodista pierde dos toques; el ciudadano no se pierde.

### 1. Un número solo no significa nada; una comparación sí — y no puedes inventarla

«RD$1,986,088,830» es una cadena. «RD$1,986,088,830 en juego en 384 procesos
abiertos hoy» es un hecho sobre el que alguien puede actuar. La segunda mitad
de la regla pesa más que la primera: **si no tenemos el ancla, se muestra la
cifra sin ella y se dice por qué. Nunca se fabrica un contexto.**

`lib/cifras.ts` lo implementa y prohíbe los tres errores clásicos: crecer desde
cero no es un porcentaje (no hay `+∞ %` ni `+100 %`), la variación de un
porcentaje se mide en **puntos** y no en por ciento, y la dirección no es
valencia — que la deuda suba no es «bueno» porque el número creció.

### 2. Una lectura está acotada o está paginada, nunca ninguna de las dos — y una lectura truncada lo declara

Media plataforma lee por barrido: 6 páginas de la DGCP, 10 del SIL, el último
mes de cada nómina. Esas cifras **no pueden ser el denominador de nada**, y
mezclarlas con censos en la misma fila de tarjetas invita a dividir una por
otra. Cada cifra declara su base junto a la cifra, no en una nota al pie que
nadie asocia tres pantallas después. `Alcance` en `lib/cifras.ts` distingue
registro, muestra e instantánea.

### 3. Reconocer, no recordar

- **La jerga se traduce en el punto de uso**, no en un glosario que nadie abre.
  Primero lo que el término hace, después cómo se llama: «se archiva si no
  avanza», y *perime* detrás. `lib/glosario.ts`.
- **El estado del sistema se ve**, incluidos los filtros que vienen de fábrica.
  Un chip que solo aparece cuando difiere del valor por defecto deja invisibles
  justo los que más recortan: quien busca y ve «0 coincidencias» nunca se
  entera de que estaba mirando treinta días.
- **La magnitud viaja con el número.** «MM» se lee *millones* en el uso
  dominicano: abreviar así miles de millones se equivoca por tres órdenes de
  magnitud en la cifra más grande del sitio.
- **La antigüedad se calcula aquí, no en la cabeza del lector.** Una fecha
  absoluta obliga a restar; en una lista de veinte, nadie resta y se deja de
  comparar. `hace()` en `lib/format.ts`, y **siempre a través de
  `components/antiguedad.tsx`**: la regla existía y se cumplía solo en las
  fichas —donde hay una fecha y sobra espacio para pensarla—, mientras las
  filas de listado, que son justo donde se compara, imprimían «Creada 3 sept
  2026» veinte veces seguidas. Nada se pierde: la fecha exacta viaja en el
  `title` y en el `dateTime` de un `<time>` de verdad.

  Se cuenta en **días de calendario dominicano**, la misma regla de
  `formatFecha`: «ayer» es la fecha de ayer en Santo Domingo, no «entre 24 y 48
  horas atrás». Con el ancla anterior al mediodía UTC, una pieza depositada hoy
  salía como fecha futura durante media mañana de cada día.

### 4. El orden de los bloques es el orden en que se entiende

Qué es → en qué punto está → qué cambia del ordenamiento → el texto → opinar.
**Nadie debería opinar sobre una pieza que la interfaz no le dejó entender**, y
por eso el widget de voto va después del documento, nunca antes.

Corolario: **el agregado no se enseña antes de preguntar.** «68 % a favor»
visible antes de votar ancla la respuesta —el efecto mejor documentado en
votación pública— en una plataforma cuya voz dice que la conclusión la saca el
lector.

### 5. Revelación progresiva

Un historial de 33 trámites en bruto no informa: entierra el único que importa
bajo treinta y dos rutinarios. Se muestra el resumen que responde la pregunta y
el resto queda a un toque, sin perder nada. El botón dice **cuántos hay**, no
«ver más»: quien decide si abre necesita saber a qué se enfrenta.
`components/plegable.tsx`.

### 6. Un control apagado explica por qué antes de que lo pulses

Y «no hay resultados» y «la fuente no contestó» son dos pantallas distintas: la
segunda dice qué pasó, qué sigue en pie y ofrece la única acción útil.

### 7. Las etiquetas cambian de forma según cuánto tiempo tiene el ojo

- **Nav global (escritorio)** — preguntas. Hay espacio y el usuario está
  eligiendo a dónde ir: la pregunta informa más que el sustantivo.
- **Barra de sección y tab bar móvil** — sustantivos cortos. Ahí ya sabe dónde
  está y necesita reconocer, no leer.
- **Un color = un significado**, en toda la plataforma. Nunca se usa un color
  porque «queda bien». La tabla vive **una sola vez**, en `lib/estados.ts`, y
  sus tonos se nombran por lo que significan —`accionable`, `contexto`,
  `cumplido`, `aviso`, `anulado`—, nunca por el estado concreto de una fuente:
  cada fuente **traduce** su vocabulario a esos cinco.

  Que estuviera centralizada no bastó. `iniciativa-card.tsx` mantenía una
  segunda tabla, con un comentario que la declaraba «alineada con
  lib/estados.ts», y estaba **invertida** en los dos colores que más pesan: el
  verde de archivo —*ya se cumplió*— marcaba una pieza recién **depositada**, y
  el azul de la firma —*se puede actuar*— marcaba una ley ya **promulgada**. A
  dos clics de distancia el mismo verde decía «terminado» y «acaba de
  empezar», y un listado del Senado entero en verde se leía como un archivo
  cerrado. La lección no es «centralizar»: es que **un comentario que afirma
  una alineación no la produce**, y que una segunda tabla es la forma concreta
  en que esta regla se rompe.

### 8. El teléfono es la pantalla, no una adaptación

«El ciudadano no estudia esta plataforma: la *consulta*, en el teléfono, entre
otras dos cosas.» Eso obliga a cosas concretas, y todas están ya en las
primitivas: lo que sigue se hereda, no se repite en cada página.

- **44 px es la medida de lo que se pulsa** en teléfono —la que recomiendan las
  guías de iOS y Android—, y 40 desde `sm`, donde hay puntero. Botón, campo,
  selector, opción y pestaña llevan los mismos saltos, así que un botón junto a
  un campo se alinea solo. Un control de 36 px solo es legítimo dentro de una
  fila, y entonces necesita 8 px de aire alrededor.
- **Un campo se escribe a 16 px.** Por debajo, Safari en iOS hace zoom al
  enfocarlo y la página se queda desplazada al soltarlo.
- **Prefiere la fila entera al enlace de tres palabras.** Una tarjeta o una fila
  de listado que lleva a un solo sitio se estira con un `::after`: el objetivo
  pasa de 320 × 20 px a la hoja completa. Lo que quede dentro y sea otro
  destino se eleva con `z-10`.
- **Un dedo no tiene `hover`.** La respuesta al toque es el `active`; el `hover`
  es un refuerzo para quien tiene puntero y nunca la única señal.
- **El texto esencial no baja de 12 px**, y la lectura principal va a 15.
  El único texto más pequeño de la casa es el `.rotulo`, que va en versalitas
  espaciadas para compensarlo.
- **Nada se lee en una tabla ancha**: por debajo de `sm` un cuadro de datos se
  apila en fichas y vuelve a ser cuadro desde `sm`.
- **Un enlace dentro de una frase es la excepción** y se queda a la altura de su
  línea: darle altura de mando rompería el párrafo.
- **Lo que flota se reparte el borde inferior.** Tab bar, barra de acciones de
  una ficha y aviso de instalación se pisaban entre sí; ahora la barra marca
  la raíz con `data-barra-acciones` y el aviso sube por encima. Cualquier
  pieza nueva que flote abajo se suma a ese reparto, no se inventa el suyo.
  El botón de volver arriba aparece tras tres pantallas. Desde `lg` flota
  siempre en la esquina. En el teléfono, en las cuatro raíces de la tab bar
  no se pinta —tapaba los títulos de las tarjetas— y sube al principio tocar
  la pestaña encendida; en cualquier otra ruta (fichas, vistas internas,
  páginas de «Más») ninguna pestaña es la página actual, así que el botón
  vuelve, por encima de la tab bar y de la barra de acciones si la hay.
- **El chrome fijo no pasa de un quinto de la pantalla.** Cabecera, barra de
  filtros y tab bar llegaron a sumar el 28 % a 390 × 844. Una barra pegajosa
  de página es una fila de 48 px, se aparta al bajar y vuelve al subir (sin
  animar con movimiento reducido).
- **La cabecera busca siempre lo mismo.** «Buscar» abre la paleta en todas
  las páginas; la búsqueda con alcance de una vertical vive dentro de su
  página, con el alcance escrito debajo. Un mismo sitio del chrome que busca
  cosas distintas según la página es una trampa.
- **Una silueta de carga miente si no mide lo que va a llegar.** Se calibra con
  la altura real medida a 390 px, donde ninguna pregunta de esta plataforma cabe
  en un solo renglón.

### 9. Dónde vive el sistema

Desde la pasada de **shadcn/ui**, en dos capas:

- **`components/ui/*`** — las piezas genéricas: `Card`, `Button`, `Badge`,
  `Input`, `Textarea`, `Label`, `Checkbox`, `Select`, `Tabs`, `ToggleGroup`,
  `Sheet`, `Dialog`, `Command`, `Breadcrumb`, `Popover`, `Collapsible`,
  `Table`, `Progress`, `Skeleton` y `Alert`.
  Es código del repositorio —no una dependencia de componentes—, con Radix por
  debajo. **Entraron por el teclado y el foco, no por el aspecto**: foco
  atrapado en una hoja modal, recorrido con flechas, Escape, y el foco de vuelta
  al disparador al cerrar.

  Están **las que se usan y solo esas**. Una pieza que nadie importa no es
  neutral: invita a usarla donde ya manda una regla de la casa —un `Accordion`
  donde `Plegable` obliga a decir cuántos hay—. La siguiente se copia de
  ui.shadcn.com cuando haga falta, y se viste con los tokens de aquí.

  Sus colores son los de esta página: el puente de tokens al final de `@theme`
  en `app/globals.css` ata el vocabulario de shadcn al de aquí —`background` es
  `canvas`, `primary` es la firma, `destructive` es el sello, `border` es el
  filete—. **No hay una segunda paleta**; hay los mismos hexadecimales con los
  nombres que espera la librería. Un color nuevo se añade arriba, en los tokens,
  y baja solo.

- **Lo que ninguna librería puede traer**, porque es doctrina y no aspecto:
  `components/papel.tsx` (`Rotulo`, `Cifra`, `TiraDeCifras`),
  `components/portada.tsx`, `components/estado-vacio.tsx`,
  `components/marca-estado.tsx`, `components/campo-busqueda.tsx`,
  `components/nav-filtros.tsx`, `components/marca.tsx`,
  `components/plegable.tsx`, `components/antiguedad.tsx`,
  `components/paleta.tsx`, `components/ruta.tsx`, `components/paginador.tsx`,
  `components/esqueleto.tsx`, `lib/estados.ts`, `lib/cifras.ts`,
  `lib/glosario.ts` y `components/termino.tsx` —el término del Estado
  subrayado con puntos que, al tocarlo, abre su definición llana en un
  `Popover`; es la forma de cumplir «la jerga se traduce en el punto de uso»
  (§3), y hereda el color de su frase para vivir igual sobre tinta que sobre
  papel—.

`Hoja`, `CabeceraHoja`, `Marca` y `Accion` **ya no existen**: son `Card`,
`CardHeader`, `Badge` y `Button`. No se envolvieron con su nombre viejo a
propósito — dos nombres para una misma cosa es la «segunda tabla» que
`lib/estados.ts` documenta como la forma concreta en que un sistema se rompe.

### 10. Cómo se sostiene esto

> «Un rojo aquí es un problema de enrutamiento, no de regla. Subir un piso,
> ampliar una lista de excepciones o relajar un emparejador **registra** el
> hallazgo en vez de arreglarlo.» — RosetSoft, `design-system.md` §14

Las jugadas legales son tres: usar la primitiva, añadir el token, o extraer el
hermano. Y la causa raíz de que esta identidad se diluyera dos veces está
diagnosticada en la misma doctrina: **donde existe una primitiva compartida la
adopción es alta; donde no existe, la idea se reimplementa en cada sitio.** La
pasada de shadcn/ui lo confirmó midiéndolo: `papel.tsx` existía y lo importaban
**dos** archivos, mientras el resto del árbol dibujaba a mano cuatro campos de
búsqueda con tres alturas, seis pantallas de «la fuente no contestó», dos marcas
de estado sobre la misma tabla de colores y siete portadas con dos tamaños de
titular. Por eso el sistema vive en las dos capas de §9 y no en cuarenta
archivos que hay que acertar uno por uno.

Y por eso una pieza nueva se añade **donde ya está su familia**: si es genérica,
a `components/ui/`; si lleva una regla de esta casa, a `components/` con su
porqué en la cabecera. Un componente suelto en una página es la primera línea de
la próxima dilución.

Y porque una regla que solo vive en un documento se vuelve a diluir, tres
clases de infracción que esta pasada encontró a mano las busca ahora el gate
(`.claude/hooks/lib.sh` y `.claude/hooks/sin-efecto.py`): el blanco de
pantalla, la píldora, y el **control mudo** —un `hover:` cuyo valor repite el
que el elemento ya tiene, o un color de anillo sin ancho de anillo, de modo que
el anillo no se pinta nunca—. El tercero no es cuestión de estilo: el control
*parece* interactivo y no responde, que es «un control apagado explica por qué»
fallando en silencio. Uno de los tres era la llamada a la acción principal del
panorama.
