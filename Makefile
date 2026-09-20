NPM ?= npm

.DEFAULT_GOAL := help
.PHONY: help install dev build preview typecheck test check assets clean clean-all

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies
	$(NPM) install

dev: ## Start the Vite dev server
	$(NPM) run dev

build: ## Build for production (dist/)
	$(NPM) run build

preview: ## Preview the production build
	$(NPM) run preview

typecheck: ## Type-check with tsc (no emit)
	$(NPM) run typecheck

test: ## Run the game logic tests (Vitest)
	$(NPM) test

check: typecheck test build ## Typecheck, test, then build

assets: ## Regenerate favicons and the social card (needs Chrome)
	node scripts/generate-assets.mjs

clean: ## Remove build artifacts
	rm -rf dist

clean-all: clean ## Remove build artifacts and node_modules
	rm -rf node_modules
