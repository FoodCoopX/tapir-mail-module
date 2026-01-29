#!/bin/bash
set -e

sudo apt-get install libxml2-dev libxslt-dev

npm install -g mjml@4.15.2
npm install -g @openapitools/openapi-generator-cli@2.7.0
pip install --upgrade pip
pip install poetry
poetry lock
poetry install --no-root

echo "The node and python packages have been installed"