---
name: verificar
description: Run the repository gate (typecheck, identity scan, statelessness and secret scan, next build) and report. Use before claiming any change is done, before /entregar, and whenever a build failure needs diagnosing.
allowed-tools: Bash, Read, Grep, Glob, Edit
---
# /verificar — the gate

There is no test suite and no ESLint; `next build` is the only real gate and
the hooks add three cheap invariants around it. Run the full mode:

```bash
./.claude/hooks/verificar.sh --completo
```

Then:
1. **If clean:** report `RESULT: clean` verbatim plus the build's route
   table summary (static vs dynamic routes changed?). Done.
2. **If red:** fix every failure in the code, not in the gate. Re-run until
   clean. Never delete a check, widen an allowlist, or add an exception to
   the hooks to make it pass; if a check is wrong, say so in the final
   message with the evidence and leave it red.
3. **Statelessness or secret failures** are architectural: stop, re-read
   CLAUDE.md §"What this is" and docs/PLAN-DEMOCRACIA.md §2, and undo the leak.
4. **Identity failures**: use the primitive in `components/papel.tsx`
   instead of the class; read `.claude/rules/identidad.md`.
5. **Build failures on Next 15**: a `node:` import reached a client bundle
   (move it to a server-only module), a `"use client"` component imported a
   server module, or a dynamic route lost `force-dynamic`. Read the last 40
   lines of the log the script names.

Optional manual checks when the change is user-facing:
- `npm run start` after the build and load the touched route on a 390 px
  viewport (Playwright with `executablePath: '/opt/pw-browsers/chromium'` in
  web sessions). Verify the copy is es-DO and the numbers carry their anchor.
- For a source adapter, exercise it once against the real origin with the
  identifiable User-Agent and show the response shape; a green typecheck is
  not proof that a source answers.

$ARGUMENTS
