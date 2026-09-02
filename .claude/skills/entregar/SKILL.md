---
name: entregar
description: Deliver finished work - sync documentation, run the gate, commit in the repository's Spanish style, rebase on origin/main, and push to main (which deploys to production). Use at the end of every task that changed files.
allowed-tools: Bash, Read, Edit, Grep, Glob
---
# /entregar — from working tree to production

Pushing to `main` deploys to https://brillo-soft.vercel.app. Nothing reaches
main unverified, and nothing stays in a container: the session is ephemeral.

## 1. Documentation is memory
Before committing, update whatever the next session would otherwise have to
rediscover:
- A new or changed source → `app/fuentes/page.tsx` (coverage, limits,
  blocks) and the data-layer note in `CLAUDE.md`; verified mechanics and
  quirks → `docs/RECON.md` (Congress) or `docs/AUDITORIA.md` (everything else), with
  the ✅/⚠️/❌ convention.
- A new route or vertical → `lib/secciones.ts`, `README.md` feature list,
  `CLAUDE.md` pages table.
- A new invariant or a rule you had to learn the hard way → the matching
  `.claude/rules/*.md`, one line, with the file that proves it.
- A decision the owner must make → `CLAUDE.md` §"Open decisions", not a
  question in chat.

## 2. Gate
```bash
./.claude/hooks/verificar.sh --completo
```
Red means not delivered. Fix, re-run.

## 3. Commit
- Spanish, present-tense imperative subject (≤ 72 chars, no trailing
  period), as the log shows: `Congreso: enlaza el texto de la ley…`.
- Body explains **why** and what was verified, in prose; the diff already
  shows the what. Mention the doc sections updated.
- No model identifiers anywhere in the message or the code (a hook blocks
  them). Keep the attribution trailers the session harness requires.
- One commit per coherent change; do not bundle unrelated fixes.

## 4. Push
```bash
git fetch origin main
git rebase origin/main        # other sessions push to main too
./.claude/hooks/verificar.sh --rapido
git push -u origin main
```
On a network failure retry with backoff (2 s, 4 s, 8 s, 16 s). Never force,
never a different branch. If the rebase conflicts, resolve keeping both
behaviors and re-run the full gate before pushing.

## 5. Report
Final message: what changed, what was verified (paste `RESULT: clean`),
what the owner must decide or do by hand (panel actions, credentials), and
the production URL of the touched route. No offers, no questions that the
docs could have answered.

$ARGUMENTS
