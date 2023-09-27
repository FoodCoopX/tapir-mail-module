#!/bin/bash
set -e

rm -rf filepond_stored_uploads
rm -rf filepond_temp_uploads
rm -rf tapir_mail/__static__
rm -rf tapir_mail/__ui__
rm -rf tapir_mail_ui/build
rm -rf tapir_mail_ui/node_modules
rm -rf tapir_mail_ui/src/api_client

echo "Cleaning done"