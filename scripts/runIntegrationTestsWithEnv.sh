#!/bin/bash
set -euo pipefail

# Check if Node.js version is at least 23
NODE_VERSION=$(node -v | cut -d. -f1 | tr -d 'v')
if [ "$NODE_VERSION" -lt 23 ]; then
  echo "Node.js version 23 or higher is required"
  exit 1
fi

# Navigate to the script's directory
cd "$(dirname "$0")/.."

# Set environment variables
export OPENAI_API_KEY="dummy-key"  # This is just to make the test run, it won't actually use the API

# Run the integration tests
bash ./scripts/integrationTests.sh 