#!/bin/bash
# Railway Deployment Test Script for ElizaOS
# This script tests the basic functionality of the deployed ElizaOS application

set -e # Exit immediately if a command exits with a non-zero status

# Display banner
echo "========================================"
echo "  ElizaOS Railway Deployment Test"
echo "========================================"

# Check if URL is provided
if [ -z "$1" ]; then
  echo "Usage: $0 <railway-url>"
  echo "Example: $0 https://elizaos.railway.app"
  exit 1
fi

RAILWAY_URL=$1
echo "Testing deployment at: $RAILWAY_URL"

# Function to test an endpoint
test_endpoint() {
  local endpoint=$1
  local expected_status=$2
  local description=$3
  
  echo -n "Testing $description... "
  
  # Make the request and capture status code
  status=$(curl -s -o /dev/null -w "%{http_code}" "$RAILWAY_URL$endpoint")
  
  if [ "$status" -eq "$expected_status" ]; then
    echo "✅ Success (Status: $status)"
    return 0
  else
    echo "❌ Failed (Expected: $expected_status, Got: $status)"
    return 1
  fi
}

# Test health endpoint
test_endpoint "/health" 200 "Health endpoint"

# Test API endpoints
test_endpoint "/api/health" 200 "API health endpoint"

# Test character API endpoint (should return 401 if not authenticated)
test_endpoint "/api/characters" 401 "Character API authentication"

echo "========================================"
echo "Testing webhook endpoint configuration..."

# Test webhook endpoint (should return 401 without proper signature)
test_endpoint "/api/webhooks/clerk" 401 "Webhook authentication"

echo "========================================"
echo "Deployment tests completed."

# Note: These are basic connectivity tests.
# For full functionality testing, manual testing with authentication is required.
echo "For complete testing, please manually verify:"
echo "1. User authentication with Clerk"
echo "2. Character creation, editing, and deletion"
echo "3. Supabase data synchronization"
echo "========================================" 