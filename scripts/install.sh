#!/bin/bash
set -e

npm install -g mjml@4.14.1
npm install -g @openapitools/openapi-generator-cli@2.7.0
pip install --upgrade pip
pip install poetry
poetry lock --no-update
poetry install

echo "The node and python packages have been installed"