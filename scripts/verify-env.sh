#!/bin/bash
# Environment Variable Verification Script for ElizaOS
# This script checks if all required environment variables are set

set -e # Exit immediately if a command exits with a non-zero status

# Display banner
echo "========================================"
echo "  ElizaOS Environment Verification"
echo "========================================"

# Define required environment variables
REQUIRED_VARS=(
  # Clerk Authentication
  "CLERK_PUBLISHABLE_KEY"
  "CLERK_SECRET_KEY"
  "CLERK_WEBHOOK_SECRET"
  
  # Supabase Configuration
  "SUPABASE_URL"
  "SUPABASE_ANON_KEY"
  "SUPABASE_SERVICE_ROLE_KEY"
  
  # Application Configuration
  "NODE_ENV"
)

# Function to check if a variable is set
check_var() {
  local var_name=$1
  local var_value=${!var_name}
  
  if [ -z "$var_value" ]; then
    echo "❌ $var_name is not set"
    return 1
  else
    echo "✅ $var_name is set"
    return 0
  fi
}

# Check environment file
if [ "$1" = "--env-file" ] && [ -n "$2" ]; then
  ENV_FILE=$2
  echo "Checking variables in $ENV_FILE..."
  
  if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Error: $ENV_FILE does not exist"
    exit 1
  fi
  
  # Source the environment file
  set -a
  source "$ENV_FILE"
  set +a
else
  echo "Checking variables in current environment..."
fi

# Check all required variables
MISSING=0
for var in "${REQUIRED_VARS[@]}"; do
  if ! check_var "$var"; then
    MISSING=$((MISSING+1))
  fi
done

# Summary
echo "========================================"
if [ $MISSING -eq 0 ]; then
  echo "✅ All required environment variables are set"
  exit 0
else
  echo "❌ $MISSING required environment variables are missing"
  echo "Please set the missing variables before proceeding"
  exit 1
fi 