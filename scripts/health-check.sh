#!/bin/bash

# Simple health check script for Railway deployment
# This script checks if the application is running properly

# Set variables
PORT=${PORT:-3000}
HEALTH_ENDPOINT="/health"
URL="http://localhost:${PORT}${HEALTH_ENDPOINT}"

# Function to check if the application is running
check_health() {
  echo "Checking health at: $URL"
  
  # Try to connect to the health endpoint
  response=$(curl -s -o /dev/null -w "%{http_code}" $URL)
  
  if [ "$response" = "200" ]; then
    echo "Health check passed: HTTP $response"
    exit 0
  else
    echo "Health check failed: HTTP $response"
    exit 1
  fi
}

# Execute health check
check_health 