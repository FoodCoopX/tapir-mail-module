#!/usr/bin/env bash
set -e

./scripts/generate_api_clients.sh

# Build the React app
export PUBLIC_URL=/static/
cd tapir_mail_ui
rm -rf build
npm install || exit 1
npm run build || exit 1

# Copy build files to Django's static directory
rm -rf ../tapir_mail/__static__/
mkdir -p ../tapir_mail/__static__/
cp -r build/* ../tapir_mail/__static__/

# Serve the built index.html as a Django template
rm -rf ../tapir_mail/__ui__/
mkdir -p ../tapir_mail/__ui__/
cp build/index.html ../tapir_mail/__ui__/

echo "React build files have been copied over to Django's static directory."
