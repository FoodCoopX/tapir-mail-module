#!/bin/bash
set -e

# Build the React app
export PUBLIC_URL=/static/

# Generate API Client
poetry run python manage.py spectacular --file schema.yml
npm install -g @openapitools/openapi-generator-cli@2.7.0
npx @openapitools/openapi-generator-cli generate -i schema.yml -g typescript-fetch -o ./tapir_mail_ui/src/api_client

# Build the React app
cd tapir_mail_ui
npm install
npm run build

# Copy build files to Django's static directory
mkdir -p ../tapir_mail/__static__/
cp -r build/* ../tapir_mail/__static__/

# Serve the built index.html as a Django template
mkdir -p ../tapir_mail/__ui__/
cp build/index.html ../tapir_mail/__ui__/

echo "React build files have been copied over to Django's static directory."