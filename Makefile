# Atajos de desarrollo. El despliegue sigue siendo manual (docs/07).

SHELL := /bin/bash
.ONESHELL:
.DEFAULT_GOAL := help

# Primer puerto libre a partir de 3000. El 3000 suele estar tomado por otro proyecto, así que
# en vez de fallar o pisar algo, se busca uno. Override: `make up PORT=3100`.
PORT ?= $(shell for p in $$(seq 3000 3020); do \
	if ! lsof -nP -iTCP:$$p -sTCP:LISTEN >/dev/null 2>&1; then echo $$p; exit 0; fi; \
	done; echo 3000)

.PHONY: up
up: db ## Levanta Postgres, aplica migraciones y arranca la app en un puerto libre
	@echo "→ app en http://localhost:$(PORT)"
	npm run dev -- -p $(PORT)

.PHONY: db
db: ## Levanta Postgres y espera el healthcheck, después migra y siembra
	@docker compose up -d --wait
	@npm run db:migrate
	@npm run db:seed

.PHONY: down
down: ## Para Postgres y conserva el volumen
	@docker compose stop

.PHONY: reset
reset: ## BORRA la base y vuelve a migrar y sembrar desde cero
	@docker compose down -v
	@docker compose up -d --wait
	@npm run db:migrate
	@npm run db:seed -- --reset

.PHONY: drain
drain: ## Drena el outbox una vez (en S2 confirma sin cadena)
	@npm run outbox:drain

.PHONY: check
check: ## Tests, tipos y linter
	@npm test
	@npm run typecheck
	@npm run lint

.PHONY: contract
contract: ## Compila y testea el contrato (requiere Foundry)
	@cd contracts/traceid && forge test

.PHONY: help
help:
	@grep -hE '^[a-z-]+:.*?## ' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "} {printf "  \033[1m%-8s\033[0m %s\n", $$1, $$2}'
