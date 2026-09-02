# Socrático.do — identidad «El Contrasello»

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

Dónde sí va el sello: el punto de la «¿», el «.do», la vertical de compras,
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

## La marca — el contrasello

`components/marca.tsx`. Dos formas del mismo glifo:

- `Sello` — circular completa con el aro de texto. Es la marca de verdad:
  pie de página, tarjeta social, portada. Nunca por debajo de 72px, donde el
  aro deja de leerse (`conAro={false}` para tamaños menores).
- `SelloCompacto` — el glifo en una plaquita, para cabecera y favicon.
- `Logotipo` — «Socrático» en serif + «.do» en sello.

**El punto es el sello.** El punto de la «¿», el del «.do» y las viñetas de
lista van en rojo. Es la regla única y no admite excepción.

## La voz

1. **Pregunta, no acusa.** Los titulares son preguntas; los datos responden.
   La conclusión la saca el lector. El nav global nombra las verticales como
   preguntas («¿Qué compra?»), porque eso es lo que el ciudadano va a buscar.
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
  comparar. `hace()` en `lib/format.ts`.

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
  porque «queda bien».

### 8. Cómo se sostiene esto

> «Un rojo aquí es un problema de enrutamiento, no de regla. Subir un piso,
> ampliar una lista de excepciones o relajar un emparejador **registra** el
> hallazgo en vez de arreglarlo.» — RosetSoft, `design-system.md` §14

Las jugadas legales son tres: usar la primitiva, añadir el token, o extraer el
hermano. Y la causa raíz de que esta identidad se diluyera dos veces está
diagnosticada en la misma doctrina: **donde existe una primitiva compartida la
adopción es alta; donde no existe, la idea se reimplementa en cada sitio.** Por
eso el sistema vive en `components/papel.tsx`, `components/marca.tsx`,
`components/plegable.tsx`, `lib/cifras.ts` y `lib/glosario.ts`, y no en
cuarenta archivos que hay que acertar uno por uno.
