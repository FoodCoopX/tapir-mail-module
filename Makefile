# Release build helper for tapir-mail-module
#
# Quick start:
#   make release     # schema -> API client -> React bundle -> wheel (verified)
#   make wheel       # only build the wheel (expects the React bundle to exist)
#   make bundle      # only build the React app into tapir_mail/__ui__ + __static__
#   make test        # python test suite
#
# If you don't run poetry directly (e.g. you use docker compose), override RUN, e.g.:
#   make release RUN="docker compose run --rm web" POETRY="docker compose run --rm web poetry"
#
# GNU make is required (uses .RECIPEPREFIX).

SHELL := bash
.DEFAULT_GOAL := help
.RECIPEPREFIX := >

RUN         ?= poetry run
POETRY      ?= poetry
NPM         ?= npm
UI_DIR      := tapir_mail_ui
UI_BUILD    := $(UI_DIR)/build
UI_STATIC   := tapir_mail/__static__
UI_TEMPLATE := tapir_mail/__ui__
DIST        := dist

.PHONY: help deps api-schema api-client bundle wheel sdist release verify-wheel test test-backend test-frontend lint clean

help: ## Show available targets
> @grep -hE '^[a-zA-Z0-9_-]+:.*## ' $(MAKEFILE_LIST) | sed -e 's/:.*## /\t-> /' | sort

deps: ## Install python and node dependencies
> $(POETRY) install
> cd $(UI_DIR) && $(NPM) install

api-schema: ## Regenerate schema.yml from the Django API
> $(RUN) python manage.py spectacular --file schema.yml

api-client: ## Regenerate the TypeScript API client from schema.yml
> rm -rf $(UI_DIR)/src/api_client
> cd $(UI_DIR) && npx --yes @openapitools/openapi-generator-cli generate -i ../schema.yml -g typescript-fetch -o ./src/api_client

bundle: ## Build the React app into tapir_mail/__ui__ and tapir_mail/__static__
> CI=false bash ./scripts/bundle.sh

wheel: ## Build the python wheel (includes the bundled UI) into dist/
> $(POETRY) build --format wheel
> @ls -l $(DIST)/*.whl

sdist: ## Build the source distribution into dist/
> $(POETRY) build --format sdist

release: api-schema api-client bundle wheel verify-wheel ## Full release build (everything needed to install)
> @echo "Release ready. Install with: pip install --force-reinstall $(DIST)/*.whl"

test: test-backend ## Run the python test suite

test-backend: ## Run the python test suite
> $(RUN) pytest

test-frontend: ## Run the React test suite
> cd $(UI_DIR) && CI=1 $(NPM) test -- --watchAll=false

lint: ## Run formatting checks
> $(RUN) black --check tapir_mail

clean: ## Remove build artifacts
> rm -rf $(UI_BUILD) $(UI_STATIC) $(UI_TEMPLATE) $(UI_DIR)/src/api_client $(DIST)
