#!/bin/bash
set -e

poetry install
pre-commit install
cp .env.dist .env
docker compose run --rm react npm install
docker compose run --rm -w /app/tapir_mail_ui react npm install
docker compose run --rm django ./scripts/generate_api_schema.sh
docker compose run --rm react bash ./scripts/generate_api_clients.sh