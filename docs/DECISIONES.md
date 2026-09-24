# Decisiones — abiertas y cerradas

Lo que el dueño ya decidió y lo que sigue siendo suyo. Una sesión **no
re-pregunta** lo de aquí ni decide por su cuenta lo que está abierto: prepara
todo, lista los pasos exactos y para (`CLAUDE.md` §Cómo opera una sesión, 1).

Vivía en `CLAUDE.md`, que se inyecta entero en cada turno. Esta lista solo
crece —cada decisión cerrada deja su rastro— y no cabe en el presupuesto de
arranque; aquí puede crecer y leerse cuando se toca el área.

## Abiertas — solo el dueño

- **Credentials for BCRD / Superintendencia de Bancos** (AUDITORIA §8.3):
  would be the first env var on a stateless surface. Until decided, macro
  comes only from the BCRD CDN files (§A.6) or not at all.
- **Dedicated Supabase project for /democracia in production**
  (PLAN-DEMOCRACIA §1): the pilot shares the `Transac` Auth pool.
- **Supabase Auth panel**: Site URL still `http://localhost:3000`, production
  domain not in the redirect allowlist, Magic Link template should send
  `{{ .Token }}`. Fixing it is a panel action; registration works without it.
  Measured 2026-09-04 (PLAN-DEMOCRACIA §5.1): GoTrue does **not** reject a
  non-allowlisted `redirect_to`, it substitutes the Site URL, and the answer
  always comes back in the URL **fragment** — so the OTP request now asks to
  return to `/democracia/registro` and self-heals the day the domain is
  allowlisted, and the registration form accepts all five return shapes,
  including the address bar the visitor is stranded on after tapping the link
  (which carries the session even though the link's token is already spent).
- **Cuenta Única OAuth2 client** (PLAN-DEMOCRACIA §9, AUDITORIA §A.11):
  identity v2 for `/democracia` is **built and inert** (public PKCE client,
  verification inside the Edge Function `vincular-cuenta-unica`, subject
  hashed with the pepper). Cuenta Única has no dynamic client registration:
  the owner requests the `client_id` from OGTIC, applies migration
  `20260902120000`, deploys the function, and sets the id in Vercel and as a
  function secret (PLAN §9.5). Until then the UI does not offer the path.
- **Secret-scan scope** (`.claude/hooks/lib.sh`): the session that built
  Cuenta Única scoped the scan so key *values* are forbidden everywhere and
  the service-role *name* only on app surfaces, because the migration's GRANT
  and the Edge Function must name it. The reviewer flagged that a session
  changed the gate it had to pass. Ratify, or revert those three hook hunks
  and accept a red gate on `supabase/`.
- **Verified identity vs. declared cédula** (PLAN-DEMOCRACIA §9.5): when a
  Cuenta Única login confirms a cédula someone else typed unverified, the RPC
  refuses with `cedula_declarada_en_uso` and displaces nobody. Decide whether
  verification should win (deleting the unverified row and its votes).
- **Push notifications for «seguimiento»** (docs/PLAN-ACCESO.md §6): following
  anything is built and lives in the browser (`localStorage`), with «qué
  cambió desde tu última visita» and RSS per ficha. Push would need stored
  subscriptions on a server — the first state outside `/democracia`. Until
  decided: no push.
- **Scheduled snapshot refresh** (PLAN-ACCESO §6): eight snapshots now feed
  the platform (`scripts/build-{fiscal,nomina,deuda,normativa,instituciones,
  obras,rnc,sismap}.py`). Normativa matters most: the Consultoría challenges
  Vercel, so its snapshot is what production shows and it ages weekly. A
  scheduled cloud session could regenerate and deliver them through the gate;
  it costs sessions, so it is the owner's call.
- **Sworn asset declarations in the document index** (AUDITORIA §G.2): 115
  PDFs titled «Declaración jurada de patrimonio <name>» are published by the
  institutions themselves under Ley 311-14, but a platform-wide index makes
  them searchable by an official's name, which is a Ley 172-13 proportionality
  call. Until decided, `scripts/build-documentos.py` excludes them by title
  (`DECLARACION`); including them is deleting that one condition and
  regenerating.
- **Institutional requests**: Consultoría Jurídica's Cloudflare allowance for
  `Socratico-Inteligencia/1.0` on its read-only APIs (AUDITORIA §4.1), ONE whitelist, Cámara de Cuentas and 911 under
  Ley 200-04, JCE electoral archive, BCRD file index, report of the exposed
  311 token and the Cuenta Única client request to OGTIC (AUDITORIA §A.9,
  §A.11, §F). Added by the third pass (AUDITORIA §G.9): responsible-disclosure
  notes to the Superintendencia de Bancos (SIMBAD's public API exposes chart
  SQL and staff users) and CAASD (default Tomcat), and Ley 200-04 requests to
  SNS/MAP/MIDEREC (closed WordPress REST), SIE/SIMV/Agricultura/INFOTEP (WAF),
  the SCJ (GET on its rulings search) and the Poder Judicial (full TLS chain).

## Cerradas, para que nadie las reabra

- **Cabecera sin preguntas; megamenú** (23-09-2026). El dueño pidió quitar
  las preguntas («¿Qué compra?») de la cabecera y un megamenú. La cabecera
  lleva tres puertas —Dinero público, Leyes, El Estado— que abren un panel con
  toda la plataforma, cada destino con su línea en llano (`lib/menu.ts`,
  `components/megamenu.tsx`); el teléfono muestra lo mismo en la hoja «Más».
  La pregunta sigue en los titulares de página y como palabra clave de la
  paleta.

- **XLSX sin dependencia**: `lib/deuda.ts` lee el ZIP directamente.
- **El Senado se lee por su consultante público**, no por su WordPress (401).
- **Los PDF se rasterizan** con pdf.js *legacy* sobre un canvas a través de
  `/api/documento`; un PDF en `<iframe>` no pinta nada en móvil.
- **Las ramas `claude/*` se pueden empujar** (14-09-2026). El guard solo
  admitía `main`, así que una sesión no podía enseñar su trabajo antes de
  desplegarlo: Vercel levanta el preview de una rama cuando llega al remoto.
  Se abrió una excepción por prefijo en `.claude/hooks/guard-bash.sh`, y nada
  más: `main` sigue siendo lo único que despliega, y la **estampa del gate se
  sigue exigiendo para cualquier push**, rama incluida. La decisión se tomó
  para ver la pasada de shadcn/ui desde el teléfono.

