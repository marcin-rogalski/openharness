#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/docker-compose.yml"
PROJECTS_DIR="${HOME}/.openharness/projects"

mkdir -p "$PROJECTS_DIR"

cleanup() {
	docker compose -f "$COMPOSE_FILE" down --remove-orphans
}

trap cleanup EXIT

docker compose -f "$COMPOSE_FILE" up --build -d

harness_port="$(docker compose -f "$COMPOSE_FILE" port harness 3000 | cut -d: -f2)"
ui_port="$(docker compose -f "$COMPOSE_FILE" port ui 80 | cut -d: -f2)"

wait_for_http() {
	local url="$1"
	local name="$2"
	local code

	for _ in {1..60}; do
		code="$(curl -s -o /dev/null -w '%{http_code}' "$url" || true)"
		if [[ "$code" =~ ^[0-9]{3}$ ]]; then
			return 0
		fi
		sleep 1
	done

	echo "$name did not become ready at $url" >&2
	return 1
}

wait_for_http "http://127.0.0.1:${harness_port}/" "harness"
wait_for_http "http://127.0.0.1:${ui_port}/" "ui"

curl -fsS \
	-X POST \
	"http://127.0.0.1:${harness_port}/api/projects/project-1/messages" \
	-H 'content-type: application/json' \
	-d '{"content":"compose check"}' > /dev/null

curl -fsS "http://127.0.0.1:${ui_port}/" | grep -q 'OpenHarness'

echo "compose check passed"
