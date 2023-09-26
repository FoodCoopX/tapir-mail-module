#!/bin/bash
set -e

rm -rf ./tapir_mail_ui/src/api_client
npx @openapitools/openapi-generator-cli generate -i schema.yml -g typescript-fetch -o ./tapir_mail_ui/src/api_client

echo "The API clients have been generated"