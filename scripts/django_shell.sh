#!/usr/bin/env bash
set -e

docker compose exec django poetry run python manage.py shell_plus