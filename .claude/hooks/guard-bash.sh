#!/bin/bash
# PreToolUse(Bash): refuse the handful of commands that would cost more than
# any session can save. Everything else passes.
source "$(dirname "$0")/lib.sh"
input="$(cat)"
cmd="$(printf '%s' "$input" | jq -r '.tool_input.command // ""' 2>/dev/null)"
[ -z "$cmd" ] && exit 0

negar() { echo "BLOCKED by .claude/hooks/guard-bash.sh: $1" >&2; exit 2; }

# History and remote safety. Production deploys from main on every push.
printf '%s' "$cmd" | grep -qE 'git push[^|;&]*(--force|-f\b|--force-with-lease)' \
  && negar "no force-push: main is production (Vercel deploys on push)."
if printf '%s' "$cmd" | grep -qE '\bgit push\b'; then
  refs="$(printf '%s' "$cmd" | grep -oE 'git push[^|;&]*' | sed -E 's/git push//; s/-u|--set-upstream|origin//g')"
  for r in $refs; do
    case "$r" in
      -*|main|HEAD:main|main:main|*[\<\>]*|[0-9]*) ;;   # flags, main, shell redirections
      *) negar "push only to main (branch policy in CLAUDE.md). Refusing ref '$r'." ;;
    esac
  done
fi
printf '%s' "$cmd" | grep -qE 'git (commit|push)[^|;&]*--no-verify' \
  && negar "--no-verify skips the gate."
printf '%s' "$cmd" | grep -qE 'git reset --hard|git checkout -- \.|git restore \.|git clean -[a-z]*f' \
  && negar "destructive working-tree reset. Inspect with git diff/stash instead."
printf '%s' "$cmd" | grep -qE '\brm -[a-zA-Z]*r[a-zA-Z]* ' \
  && ! printf '%s' "$cmd" | grep -qE 'rm -[a-zA-Z]*r[a-zA-Z]* +(\./)?(node_modules|\.next|out|/tmp|"?\$?\{?CLAUDE|/root/\.claude|\$SCRATCH)' \
  && negar "recursive rm outside node_modules/.next/tmp. Delete specific files."

# Secrets and statelessness (CLAUDE.md: no env vars, no secrets in the app).
printf '%s' "$cmd" | grep -qE '(>|tee)[[:space:]]*\.env(\.|[[:space:]]|$)' \
  && ! printf '%s' "$cmd" | grep -qE '(>|tee)[[:space:]]*\.env\.example' \
  && negar "never write .env files; the app carries no secrets (PLAN-DEMOCRACIA.md §2)."
printf '%s' "$cmd" | grep -qE 'vercel env (add|rm|pull)|supabase secrets' \
  && negar "environment/secret changes are the owner's decision; report them instead."

# Model identifiers never go into commits or files.
printf '%s' "$cmd" | grep -qE 'git commit' && printf '%s' "$cmd" | grep -qiE 'claude-(opus|sonnet|haiku|fable|mythos)-[0-9]' \
  && negar "no model IDs in commit messages."

exit 0
