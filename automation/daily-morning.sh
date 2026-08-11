#!/bin/bash
set -euo pipefail

# Run from launchd/cron with a minimal environment.
# Set CAREER_OPS_ROOT to the repo root before starting this script.

ROOT="${CAREER_OPS_ROOT:-}"
if [[ -z "$ROOT" ]]; then
  echo "CAREER_OPS_ROOT is not set" >&2
  exit 1
fi

cd "$ROOT"

NODE_BIN="${NODE_BIN:-$(command -v node)}"
if [[ -z "$NODE_BIN" ]]; then
  echo "node not found on PATH" >&2
  exit 1
fi

# 1) Refresh the pipeline with fresh public roles.
"$NODE_BIN" scan.mjs

# 2) Process pending URLs into scored reports so the morning view is ready to apply.
#    Use the OpenRouter runner if available because it keeps the pipeline moving
#    even when a local CLI is not installed.
if [[ -x "$ROOT/node_modules/.bin/npm" ]]; then
  :
fi

if command -v npm >/dev/null 2>&1; then
  npm run or:pipeline
else
  "$NODE_BIN" openrouter-runner.mjs pipeline
fi
