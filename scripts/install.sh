#!/usr/bin/env bash
set -e

npm install -g mjml@4.15.2
npm install -g @openapitools/openapi-generator-cli@2.30.2
pip install --upgrade pip
pip install poetry
poetry lock
poetry install --no-root

echo "The node and python packages have been installed"