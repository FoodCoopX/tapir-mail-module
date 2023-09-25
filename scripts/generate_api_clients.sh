#!/bin/bash
set -e

poetry run python manage.py spectacular --file schema.yml
rm -rf ./tapir_mail_ui/src/api_client
npx @openapitools/openapi-generator-cli generate -i schema.yml -g typescript-fetch -o ./tapir_mail_ui/src/api_client

echo "The API schema has been updated and the clients generated"