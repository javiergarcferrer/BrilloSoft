# Socrático.do — arranque de sesión

Plataforma de inteligencia en español dominicano (es-DO) sobre datos del Estado.
Herramienta **independiente y no oficial**: el pie y los metadatos lo dicen y
eso no se toca. Todo el texto de cara al usuario va en es-DO.

Este archivo se inyecta entero en cada turno, así que es el presupuesto más caro
del repositorio: **una línea por regla, y el enlace a la página que la explica.**
Techo 120 líneas / 12 KB, comprobado por el gate. Lo que crezca va a `docs/`.

## Qué es

| Vertical | Ruta | Fuente | Capa de datos |
|---|---|---|---|
| Compras públicas | `/licitaciones` | API abierta de la DGCP | `lib/dgcp.ts` |
| Finanzas públicas | `/finanzas` | SIGEF (instantánea) | `lib/fiscal.ts`, `lib/capitulos.ts` |
| Congreso Nacional | `/congreso` | SIL Diputados + consultante del Senado | `lib/congreso.ts`, `lib/senado.ts` |
| Normativa del Ejecutivo | `/normativa` | Consultoría Jurídica (token + POST) | `lib/normativa.ts` |
| Nómina estatal | `/nomina` | Instantánea de 11 instituciones | `lib/nomina.ts`, `lib/nomina-server.ts` |
| Deuda pública | tarjeta en `/` | Crédito Público (XLSX + instantánea) | `lib/deuda.ts` |
| Democracia | `/democracia` | Supabase, esquema `democracia` — **la excepción** | `lib/democracia.ts`, `lib/supabase.ts` |

`lib/secciones.ts` es la fuente única de verticales y navegación. `/` es el
panorama; `/fuentes` declara qué alimenta la plataforma, qué está bloqueado y
con qué límites de cobertura — mantenerlo cierto es parte de tocar una fuente.

## La invariante

**Las superficies de inteligencia no tienen base de datos ni variables de
entorno.** Todo se lee en vivo y se cachea con `revalidate`. Nunca se introduce
una DB, una API key ni un secreto en licitaciones, congreso, nómina, finanzas,
normativa, deuda, el panorama ni `/fuentes`.

**La única excepción documentada es `/democracia`** (voto ciudadano), que por
naturaleza necesita persistencia e identidad. Usa Supabase confinado al esquema
`democracia`, y la app solo lleva claves **publicables**; lo sensible —el pepper
de la cédula, la verificación del ID token, el service role— vive dentro de
Postgres y de una Edge Function. La excepción no se filtra: ninguna otra
vertical lee ni escribe la DB. Los hooks lo impiden antes de que se escriba.

## Qué documento responde a qué

| La pregunta | La página |
|---|---|
| ¿Cómo debe **verse** y sonar? ¿Qué primitiva uso? | `docs/IDENTIDAD.md` — si la interfaz la contradice, la interfaz está mal |
| ¿Dónde vive **X**? ¿Por qué está escrito así? | `docs/ARQUITECTURA.md` — capas, rutas de API, páginas, rendimiento percibido |
| ¿Cómo se lee el **Congreso**? | `docs/RECON.md` — mecánica verificada del SIL, el consultante, cadenas de documentos |
| ¿Y **cualquier otra fuente** del Estado? | `docs/AUDITORIA.md` — estado ✅/⚠️/❌, familias de acceso, bloqueos y su desbloqueo institucional |
| ¿Cómo funciona la **excepción** de la DB? | `docs/PLAN-DEMOCRACIA.md` — esquema, RLS, RPCs, seguridad, Cuenta Única (§9) |
| ¿Qué **decidió el dueño** y qué falta decidir? | `docs/DECISIONES.md` — no se re-preguntan ni se deciden aquí |
| ¿Qué archivos **moldean una sesión**? | `docs/HARNESS.md` — inventario, orden de carga, dónde va una regla nueva |

Los `.claude/rules/*.md` se cargan solos al tocar rutas que coinciden y condensan
la página que nombran en su cabecera; nunca la sustituyen.

## Cómo opera una sesión

El dueño lleva esta empresa solo y no está en el circuito mientras trabajas.
Las sesiones terminan trabajo; no devuelven preguntas.

1. **Decide, deja registro, sigue.** Los juicios de rutina son tuyos; el porqué
   va en el cuerpo del commit. Solo se pregunta lo irreversible o lo que cuesta
   dinero: migraciones sobre el Supabase vivo, cambios en su panel de Auth,
   credenciales o dependencias con claves, borrar datos, gestiones
   institucionales. Para eso: prepara todo, lista los pasos exactos, y para.
2. **Verifica antes de afirmar.** Una fuente «funciona» solo tras una respuesta
   real con el User-Agent identificable; un cambio está «hecho» solo cuando
   `./.claude/hooks/verificar.sh --completo` imprime `RESULT: clean`.
3. **La documentación es la memoria.** Lo que la próxima sesión tendría que
   redescubrir va a la página que lo posee, con la convención ✅/⚠️/❌, y a
   `/fuentes` cuando toca una fuente. El chat no es memoria.
4. **Se entrega a `main`.** Cada push a `main` despliega a producción. Rebase
   sobre `origin/main` (otras sesiones también empujan), gate completo **sobre
   el árbol ya rebasado** —el gate estampa el commit y el guard rechaza un push
   sin estampa—, y push. Nunca `--force`, nunca otra rama, nunca `--no-verify`.
5. **Nunca se debilita un check para pasarlo.** Si un hook o el gate se
   equivoca, se deja rojo y se dice con evidencia. Las jugadas legales son
   tres: usar la primitiva, añadir el token, extraer el hermano.
6. **Nunca se evade un bloqueo.** WAF, challenge, 403/470, robots, CAPTCHA: la
   respuesta es institucional y se escribe, no se rodea. Jamás una credencial
   filtrada.

## Comandos

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # build de producción — incluye el typecheck
npx tsc --noEmit # solo typecheck

python3 scripts/build-fiscal.py   # regenera public/data/fiscal.json (SIGEF, ~5 min)
python3 scripts/build-nomina.py   # regenera public/data/nomina.json
python3 scripts/build-deuda.py    # regenera public/data/deuda.json
```

No hay suite de pruebas ni ESLint: `next build` es el gate real, envuelto por
`./.claude/hooks/verificar.sh --completo` (typecheck, identidad, controles sin
efecto, statelessness, secretos, harness, build). El lockfile fija **Next 15**;
se compila contra él (`npm ci`) — Turbopack en 16 tolera cosas que webpack en 15
rechaza, como un import `node:` llegando a un bundle de cliente.

Habilidades: `/verificar` (el gate), `/entregar` (docs → gate → commit → push),
`/nueva-fuente` (QRSPI de una fuente del Estado). Agentes: `recon` (reconocimiento
de campo con la higiene de la plataforma), `revisor` (revisión de solo lectura
contra todas las reglas de arriba).

## Convenciones

Next.js 15 **App Router** + React 19 + TypeScript + Tailwind CSS 4 (plugin
`@tailwindcss/postcss`; los tokens y utilidades viven en `app/globals.css`). El
alias `@/*` resuelve a la **raíz del repositorio** — este proyecto no usa `src/`.
Los mensajes de commit van en español, sujeto imperativo, cuerpo en prosa que
explica el porqué.
