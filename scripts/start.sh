#!/bin/bash

# Simple start script for Railway deployment
# This script starts the application and ensures it's running properly

# Set environment variables if not already set
export NODE_ENV=${NODE_ENV:-production}
export PORT=${PORT:-3000}

# Log startup information
echo "Starting ElizaOS application in $NODE_ENV mode on port $PORT"

# Start the application
node packages/user-management-api/dist/index.js 