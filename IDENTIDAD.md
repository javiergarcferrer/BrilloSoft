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

Las etiquetas cambian de forma según cuánto tiempo tiene el ojo:

- **Nav global (escritorio)** — preguntas. Hay espacio y el usuario está
  eligiendo a dónde ir: la pregunta es más informativa que el sustantivo.
- **Barra de sección y tab bar móvil** — sustantivos cortos. Ahí el usuario ya
  sabe dónde está y necesita reconocer, no leer. Una pregunta de tres palabras
  en una pestaña de 72px es ruido.
- **Un color = un significado**, en toda la plataforma: azul se puede pulsar,
  rojo es el sello o lo que deroga, ocre avisa, verde ya está hecho, gris es
  contexto. Nunca se usa un color solo porque «queda bien».
