#!/usr/bin/env bash
# Runs tsc --noEmit from the correct project directory
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FILE="$1"

# Find which package directory contains the file
for dir in libs/tempo harness; do
  if [[ "$FILE" == "$dir"/* ]]; then
    cd "$ROOT/$dir" && "./node_modules/.bin/tsc" --noEmit --project "tsconfig.json"
    exit $?
  fi
done

echo "No tsconfig found for $FILE"
exit 1
