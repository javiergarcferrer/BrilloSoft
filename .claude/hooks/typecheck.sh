#!/bin/bash
# PostToolUse(Edit|Write|MultiEdit) on .ts/.tsx: the typecheck takes ~2 s on
# this repo, so run it after every edit and surface errors immediately
# instead of at build time. Exit 2 shows the errors to the model; the edit
# itself already happened.
source "$(dirname "$0")/lib.sh"
input="$(cat)"
archivo="$(printf '%s' "$input" | jq -r '.tool_input.file_path // ""' 2>/dev/null)"
case "$archivo" in *.ts|*.tsx) ;; *) exit 0 ;; esac
cd "$ROOT" || exit 0
[ -d node_modules/typescript ] || exit 0

salida="$(timeout 60 npx tsc --noEmit --pretty false 2>&1)"
if [ -n "$salida" ]; then
  echo "tsc --noEmit reports errors after editing ${archivo#"$ROOT"/} (fix before moving on; npm run build will fail):" >&2
  printf '%s\n' "$salida" | head -25 >&2
  exit 2
fi
exit 0
