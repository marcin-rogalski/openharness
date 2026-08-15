.PHONY: help install build start watch down logs test check

help:
	@echo "OpenHarness Makefile"
	@echo "  make install - install local package dependencies"
	@echo "  make build   - build Docker images"
	@echo "  make start   - build and start Docker Compose services"
	@echo "  make watch   - build and run Docker Compose services in the foreground"
	@echo "  make down    - stop Docker Compose services"
	@echo "  make logs    - follow Docker Compose logs"
	@echo "  make test    - run package unit tests with coverage"
	@echo "  make check   - run Vitest compose integration tests and Playwright E2E tests"

install:
	npm --prefix libs/tempo install
	npm --prefix harness install
	npm --prefix ui install
	npm --prefix integration install
	npm --prefix integration exec playwright install chromium

build:
	docker compose build

start: build
	docker compose up -d

watch: build
	docker compose up

down:
	docker compose down

logs:
	docker compose logs -f

test:
	npm --prefix libs/tempo run coverage
	npm --prefix harness run coverage
	npm --prefix ui run coverage

check:
	npm --prefix integration run check
