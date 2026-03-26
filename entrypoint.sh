#!/bin/sh
set -e

# Start Go API in the background
cd /app
./server &

# Wait for API to be ready before nginx starts accepting traffic
for i in $(seq 1 20); do
  if wget -qO- http://127.0.0.1:8080/health > /dev/null 2>&1; then
    break
  fi
  sleep 0.5
done

# Start nginx in the foreground (PID 1 replacement)
exec nginx -g 'daemon off;'
