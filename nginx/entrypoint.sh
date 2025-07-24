#!/bin/sh
set -e

SERVER_NAME=${SERVER_NAME:-localhost}
SERVER_NAME=192.168.0.105
CERT_DIR="/etc/nginx/ssl"
mkdir -p "$CERT_DIR"

# Generate certs if they don't exist
if [ ! -f "$CERT_DIR/selfsigned.crt" ] || [ ! -f "$CERT_DIR/selfsigned.key" ]; then
  echo "Generating self-signed certificate for $SERVER_NAME"
  openssl req -x509 -nodes -days 365 \
    -newkey rsa:2048 \
    -keyout "$CERT_DIR/selfsigned.key" \
    -out "$CERT_DIR/selfsigned.crt" \
    -subj "/CN=$SERVER_NAME"
else
  echo "Certificate already exists, skipping generation."
fi

# Stop nginx if running (ignore errors)
nginx -s quit || true

# Replace nginx.conf with nginx_ssl.conf
cp /etc/nginx/nginx_ssl.conf /etc/nginx/nginx.conf

# Start nginx in the foreground
exec nginx -g "daemon off;"
