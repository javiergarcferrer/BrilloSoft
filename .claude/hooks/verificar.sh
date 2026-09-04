#!/bin/bash
# The gate. `--rapido` (default): typecheck + identity + statelessness scan,
# ~3 s. `--completo`: also `next build`, the only real gate this repo has
# (no tests, no ESLint). Used by the Stop hook (rapido) and /verificar.
# Prints a report; exit 1 on any failure.
source "$(dirname "$0")/lib.sh"
cd "$ROOT" || exit 1
modo="${1:---rapido}"
fallos=0
ok()   { echo "  ok   $1"; }
mal()  { echo "  FAIL $1"; fallos=$((fallos+1)); }

echo "verificar ($modo) — $(git branch --show-current 2>/dev/null) @ $(git rev-parse --short HEAD 2>/dev/null)"

# 0. Dependencies.
if [ -d node_modules/next ]; then ok "node_modules present"; else mal "node_modules missing — npm ci"; fi

# 1. Typecheck.
if [ -d node_modules/typescript ]; then
  if salida="$(timeout 120 npx tsc --noEmit --pretty false 2>&1)" && [ -z "$salida" ]; then
    ok "tsc --noEmit"
  else
    mal "tsc --noEmit"; printf '%s\n' "$salida" | head -20 | sed 's/^/       /'
  fi
fi

# 2. Identity (docs/IDENTIDAD.md prohibitions) across the UI tree.
hallazgos="$( { grep -rnE "$IDENTIDAD_PATRONES" app components --include=*.tsx --include=*.css 2>/dev/null; \
                grep -rnP "$EMOJI_PATRON" app components --include=*.tsx 2>/dev/null; } \
              | grep -vE ':[0-9]+:[[:space:]]*(//|/?\*)' | head -10)"
if [ -z "$hallazgos" ]; then ok "identity: no gradients/blur/glass shadows/rounded-2xl+/emoji"; else mal "identity violations"; printf '%s\n' "$hallazgos" | sed 's/^/       /'; fi

# 2b. Controls that promise a response and give none (see sin-efecto.py).
if command -v python3 >/dev/null 2>&1; then
  if muertos="$(python3 "$(dirname "$0")/sin-efecto.py" "$ROOT" 2>/dev/null)" && [ -z "$muertos" ]; then
    ok "hover: every hover changes something"
  else
    mal "hover without effect"; printf '%s\n' "$muertos" | sed 's/^/       /'
  fi
fi

# 3. Statelessness: env vars and Supabase confined to /democracia.
fuera="$( { grep -rlE 'process\.env\.' app lib components --include=*.ts --include=*.tsx 2>/dev/null; \
            grep -rlE '@supabase/supabase-js|@/lib/supabase["'"'"']' app lib components --include=*.ts --include=*.tsx 2>/dev/null; } \
          | sort -u | while read -r f; do es_archivo_democracia "$f" || echo "$f"; done)"
if [ -z "$fuera" ]; then ok "stateless surfaces: no env/DB outside /democracia"; else mal "env/DB reached a stateless surface"; printf '%s\n' "$fuera" | sed 's/^/       /'; fi

# 4. Secrets anywhere tracked.
sec="$( { git grep -nE "$SECRETO_VALORES" -- ':!package-lock.json' ':!.claude/hooks/*'; \
          git grep -nE "$SECRETO_NOMBRES" -- ':!package-lock.json' ':!.claude/hooks/*' ':!supabase/*' ':!*.md'; } 2>/dev/null | head -5)"
if [ -z "$sec" ]; then ok "no server keys in tracked files"; else mal "possible secret in tracked files"; printf '%s\n' "$sec" | sed 's/^/       /'; fi

# 5. Documentation duties: a new lib adapter or route should be declared.
nuevos="$(git diff --name-only --diff-filter=A origin/main...HEAD 2>/dev/null; git status --porcelain 2>/dev/null | grep -E '^\?\?|^A' | awk '{print $2}')"
if printf '%s\n' "$nuevos" | grep -qE '^lib/[a-z-]+\.ts$'; then
  if git diff --quiet origin/main...HEAD -- app/fuentes/page.tsx CLAUDE.md 2>/dev/null && git diff --quiet -- app/fuentes/page.tsx CLAUDE.md 2>/dev/null; then
    mal "new lib/*.ts adapter without touching app/fuentes/page.tsx or CLAUDE.md — declare the source and its limits"
  else ok "new adapter is declared in /fuentes or CLAUDE.md"; fi
fi

# 5b. The harness's own claims (ceiling, paths, rule ownership, frontmatter).
if arn="$("$(dirname "$0")/harness.sh" "$ROOT" 2>&1)" && [ -z "$arn" ]; then
  ok "harness: CLAUDE.md within budget, paths resolve, rules own a page, frontmatter valid"
else
  mal "harness drift"; printf '%s\n' "$arn" | sed 's/^/       /'
fi

# 6. Build (completo only).
LOG="${TMPDIR:-/tmp}/socratico-build.log"
if [ "$modo" = "--completo" ]; then
  if timeout 600 npm run build >"$LOG" 2>&1; then ok "npm run build"; rm -f "$LOG"
  else mal "npm run build (see $LOG)"; tail -30 "$LOG" | sed 's/^/       /'; fi
fi

# 7. The stamp. `main` deploys to production on every push, so the gate has to
# sit IN FRONT of the push — CI behind it cannot un-ship a red. A full green on
# a clean tree stamps HEAD's sha in .git/harness-gate; guard-bash.sh refuses a
# push to main without a stamp that matches. A rebase or a new commit voids it
# on purpose: the pre-rebase green never counts for the tree being pushed.
if [ "$fallos" -eq 0 ] && [ "$modo" = "--completo" ]; then
  if [ -z "$(git status --porcelain 2>/dev/null)" ]; then
    git rev-parse HEAD > "$(git rev-parse --git-dir)/harness-gate" 2>/dev/null \
      && ok "stamped $(git rev-parse --short HEAD) — push to main allowed"
  else
    ok "not stamped: working tree dirty (commit, then re-run to earn the push)"
  fi
fi

if [ "$fallos" -eq 0 ]; then echo "RESULT: clean"; exit 0; else echo "RESULT: $fallos failure(s)"; exit 1; fi
