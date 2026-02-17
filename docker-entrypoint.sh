#!/bin/sh
set -e

echo "Starting My Care Personal Assistant Pricing App..."
echo "Environment: ${NODE_ENV:-development}"
echo "Port: ${PORT:-3001}"

# Check if PM2 ecosystem config exists
if [ -f ecosystem.config.cjs ]; then
    echo "Starting with PM2..."
    pm2-runtime start ecosystem.config.cjs
else
    echo "Starting with Node directly..."
    node server.js
fi
