---
paths:
  - "app/**"
  - "components/**"
---
# «El Contrasello» — what the UI may and may not do

IDENTIDAD.md is the source of truth: if the interface contradicts it, the
interface is wrong. Read it in full before any visual work. The rules below
are enforced by `.claude/hooks/guard-edit.sh` and `verificar.sh`.

## Prohibitions (the 215 violations that were once cleaned up)
1. No gradients, no blur washes (`bg-gradient-*`, `blur-3xl`). Dark panels are flat ink.
2. No glass shadows. Surfaces separate with the hairline (`border-hairline`).
   `shadow-card`/`shadow-soft` only for what truly floats: menus, sheets, the FAB.
3. `rounded-lg` (8 px) is the maximum on surfaces; `rounded-full` only for
   dots, seals, avatars. Never `rounded-2xl`/`rounded-3xl`.
4. No emoji, no decorative icons. Stroke icons (16/20/24) from `components/icons.tsx`.
5. No coat of arms, no flag. Independent, not official.

## Use the primitives, not hand-rolled markup
`components/papel.tsx` (Hoja, and the paper vocabulary), `components/marca.tsx`
(Sello, SelloCompacto, Logotipo), `components/plegable.tsx` (progressive
disclosure; the button says how many, never "ver más"), `lib/cifras.ts`
(a number with its anchor and scope; never invent a comparison, no `+∞ %`,
percentage deltas in points), `lib/glosario.ts` (jargon translated at the
point of use). If a primitive is missing, add it there; do not reimplement
the idea in one page. Legal moves are three: use the primitive, add the
token, or extract the sibling. Adding an exception or relaxing a matcher
registers the finding instead of fixing it.

## Color and type
- `canvas` paper background, never white. `ink`/`ink-soft` text. `brand-*`
  (ballpoint blue) is the working color: links, buttons, active states.
  `sello-*` (stamp red) is scarce: the dot of «¿», the «.do», the compras
  vertical, «Deroga». `alerta-*` ochre for deadlines, `valido-*` green for
  what is fulfilled, `--color-v-*` only for orientation, never content.
- Instrument Serif (`font-display`, weight 400) asks: h1/h2. Public Sans
  explains: body/UI. IBM Plex Mono registers: amounts, codes, dates, `.rotulo`.
  A 14 px panel title is sans bold, not serif.
- The dot is always seal red (`.punto-sello`). No exception.

## Voice and cognitive ergonomics (IDENTIDAD.md §Ergonomía)
- Headlines are questions; data answers; the reader concludes.
- Cite the source and date next to every figure, or do not show the figure.
  What the source denies is declared denied. Snapshots and samples say so
  next to the number, not in a footnote.
- Plain es-DO first, the technical term after («se archiva si no avanza» → *perime*).
- Whole document alongside every explanation. The order of blocks is the
  order of understanding: what it is → where it stands → what it changes →
  the text → vote. Aggregates are never shown before the reader answers.
- Defaults are visible as chips; disabled controls explain why before the tap;
  "no results" and "the source did not answer" are two different screens.
- Mobile first: the citizen consults on a phone between two other things.
  Tables collapse to two lines per row at 390 px; nothing depends on hover.
- All copy in Spanish (es-DO). Dates through `formatFecha` (fixed
  `America/Santo_Domingo`), amounts through `formatMonto`, age through `hace()`.
