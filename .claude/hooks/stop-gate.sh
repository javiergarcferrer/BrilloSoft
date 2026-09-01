#!/bin/bash
# Stop: a session may not end with a red gate. If code changed, run the fast
# verification; on failure, block the stop and hand the report back so the
# session fixes it. `stop_hook_active` prevents recursion.
source "$(dirname "$0")/lib.sh"
input="$(cat)"
[ "$(printf '%s' "$input" | jq -r '.stop_hook_active // false' 2>/dev/null)" = "true" ] && exit 0
cd "$ROOT" || exit 0
git rev-parse --git-dir >/dev/null 2>&1 || exit 0

# Anything changed vs origin/main (committed or not)?
cambios="$( { git diff --name-only origin/main...HEAD 2>/dev/null; git status --porcelain 2>/dev/null | awk '{print $2}'; } | grep -E '\.(ts|tsx|css|json)$' | head -1)"
[ -z "$cambios" ] && exit 0

if ! informe="$("$ROOT/.claude/hooks/verificar.sh" --rapido 2>&1)"; then
  {
    echo "The session cannot end with a red gate. verificar --rapido failed:"
    printf '%s\n' "$informe"
    echo "Fix, then run .claude/hooks/verificar.sh --completo before committing and pushing."
  } >&2
  exit 2
fi
exit 0
