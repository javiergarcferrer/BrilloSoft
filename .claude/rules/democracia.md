---
paths:
  - "app/democracia/**"
  - "components/democracia/**"
  - "lib/democracia.ts"
  - "lib/supabase.ts"
  - "lib/supabase-config.ts"
  - "lib/cedula.ts"
  - "supabase/**"
---
# `/democracia` — the one stateful vertical

PLAN-DEMOCRACIA.md governs; read §2 (architecture), §3 (schema), §4 (security)
before changing anything here. This is an **independent, unofficial citizen
pilot**; every surface says so.

## Boundary
- Supabase project `Transac`, schema `democracia` only. The auth pool is
  shared with another app: voting requires a `democracia.votantes` row
  created by the cédula flow; an authenticated stranger cannot vote.
- The app carries **publishable keys only** (`lib/supabase-config.ts`, with
  literal fallbacks). No service-role key, no server secret, ever, anywhere.
  The cédula-hash pepper lives in `democracia.secretos`, readable only by the
  `SECURITY DEFINER` RPCs.
- The Supabase client (`lib/supabase.ts`) is imported only by democracia
  modules. Other verticals may render `components/democracia/*` and call
  `lib/democracia.ts` helpers (the congress fichas embed the vote widget);
  they never touch the client. Hooks enforce this.

## Security invariants (PLAN §4) — do not weaken
1. Store the HMAC of the cédula, never the cédula; no names; email only in Auth.
2. Luhn and uniqueness are checked in the RPC; client validation is feedback only.
3. RLS on every table; a user sees and edits only their rows. Only the
   `agregados_publicos` view is readable by `anon`: counts, never who.
4. One vote per cédula (unique hash + PK). Right to erasure via `eliminar_votante()`.
5. No PII in logs. Rate limits on OTP and registration stay on.

## Changing the database
- Schema changes are **migrations** under `supabase/migrations/` with the
  existing timestamp naming, written to be re-runnable. Applying a migration
  to the live project, changing Auth settings (Site URL, email templates,
  redirect allowlist), or creating a dedicated project are **owner actions**:
  prepare the SQL and the exact panel steps, report, do not apply.
- Test RLS from both roles before claiming a change is safe.

## UI order (IDENTIDAD.md §4)
Understand → read the text → vote. The vote widget goes after the document,
its buttons are disabled with the reason shown **above** the control when the
visitor cannot vote, and the aggregate appears only after the visitor has
voted («N personas ya opinaron» before).
