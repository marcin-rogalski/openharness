#!/usr/bin/env bash
# Runs biome check/fix from the correct project directory
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FILE="$1"

# Find which package directory contains the file
for dir in libs/tempo harness; do
  if [[ "$FILE" == "$dir"/* ]]; then
    RELFILE="${FILE#$dir/}"
    cd "$ROOT/$dir" && "./node_modules/.bin/biome" check --fix --unsafe "$RELFILE"
    exit $?
  fi
done

echo "No biome config found for $FILE"
exit 1
