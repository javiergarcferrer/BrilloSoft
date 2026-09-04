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
- **Institutional requests**: ONE whitelist, Cámara de Cuentas and 911 under
  Ley 200-04, JCE electoral archive, BCRD file index, report of the exposed
  311 token and the Cuenta Única client request to OGTIC (AUDITORIA §A.9,
  §A.11, §F).

## Cerradas, para que nadie las reabra

- **XLSX sin dependencia**: `lib/deuda.ts` lee el ZIP directamente.
- **El Senado se lee por su consultante público**, no por su WordPress (401).
- **Los PDF se rasterizan** con pdf.js *legacy* sobre un canvas a través de
  `/api/documento`; un PDF en `<iframe>` no pinta nada en móvil.

