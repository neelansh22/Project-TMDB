#!/bin/bash
# Azure App Service Startup Script for Next.js

echo "Starting Teneo Memory Dashboard..."
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# Set port from Azure environment variable
export PORT="${PORT:-3000}"
echo "Using port: $PORT"

# Start the application
node server.js
