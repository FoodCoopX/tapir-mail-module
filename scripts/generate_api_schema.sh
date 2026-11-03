#!/usr/bin/env bash
set -e

poetry run python manage.py spectacular --file schema.yml
echo "The API schema has been updated"