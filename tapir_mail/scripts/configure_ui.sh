#!/bin/bash

# Set the react environment variables here
OUTPUT_PATH=${1:-./tapir_mail/__static__/config.js}

cat <<EOF >$OUTPUT_PATH
window._env_ = {
  REACT_APP_API_ROOT: "${REACT_APP_API_ROOT:-http://localhost:8000}",
  REACT_APP_BASENAME: "${REACT_APP_BASENAME:-/}",
}
EOF