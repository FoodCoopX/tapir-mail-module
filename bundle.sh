#!/bin/bash
set -e

# Navigate to the React app's directory
cd tapir_mail_ui

# Build the React app
export PUBLIC_URL=/static/
npm run build

# Copy build files to Django's static directory
mkdir -p ../tapir_mail/__static__/
cp -r build/* ../tapir_mail/__static__/

# Serve the built index.html as a Django template
mkdir -p ../tapir_mail/__ui__/
cp build/index.html ../tapir_mail/__ui__/

echo "React build files have been copied over to Django's static directory."