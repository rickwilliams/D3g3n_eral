#!/bin/bash
# Railway Deployment Script for ElizaOS
# This script handles the entire deployment process to Railway

set -e # Exit immediately if a command exits with a non-zero status

# Display banner
echo "========================================"
echo "  ElizaOS Railway Deployment"
echo "========================================"

# Navigate to the project root
cd "$(dirname "$0")"/..

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI is not installed."
    echo "Please install it with: npm i -g @railway/cli"
    exit 1
else
    echo "✅ Railway CLI is installed"
fi

# Check if user is logged in to Railway
echo "Checking Railway login status..."
if ! railway whoami &> /dev/null; then
    echo "❌ You are not logged in to Railway."
    echo "Please login with: railway login"
    exit 1
else
    echo "✅ You are logged in to Railway"
fi

# Run local tests to ensure everything is working
echo "========================================"
echo "Running local tests..."
if ./scripts/run-local-tests.sh; then
    echo "✅ Local tests passed"
else
    echo "❌ Local tests failed. Please fix the issues before deploying."
    exit 1
fi

# Check if .env.railway exists
if [ ! -f ".env.railway" ]; then
    echo "⚠️ Warning: .env.railway file not found."
    echo "Creating .env.railway from .env.example..."
    cp .env.example .env.railway
    echo "Please edit .env.railway with your production values before continuing."
    echo "Press Enter to continue or Ctrl+C to abort..."
    read
fi

# Verify environment variables in .env.railway
echo "========================================"
echo "Verifying environment variables in .env.railway..."
if ./scripts/verify-env.sh --env-file .env.railway; then
    echo "✅ Environment variables in .env.railway are valid"
else
    echo "❌ Environment variables in .env.railway are invalid."
    echo "Please fix the issues before deploying."
    exit 1
fi

# Set up Railway environment variables
echo "========================================"
echo "Setting up Railway environment variables..."
echo "This will overwrite existing variables in Railway."
echo "Press Enter to continue or Ctrl+C to abort..."
read

# Load variables from .env.railway and set them in Railway
while IFS='=' read -r key value || [[ -n "$key" ]]; do
    # Skip comments and empty lines
    if [[ $key == \#* ]] || [[ -z "$key" ]]; then
        continue
    fi
    
    # Remove quotes from value if present
    value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
    
    echo "Setting $key in Railway..."
    railway variables set "$key=$value" > /dev/null
done < .env.railway

echo "✅ Environment variables set in Railway"

# Build the application for production
echo "========================================"
echo "Building the application for production..."
NODE_ENV=production pnpm build

# Deploy to Railway
echo "========================================"
echo "Deploying to Railway..."
railway up

# Check deployment status
echo "========================================"
echo "Checking deployment status..."
railway status

# Get the deployment URL
echo "========================================"
echo "Getting deployment URL..."
RAILWAY_URL=$(railway service open --url)

if [ -z "$RAILWAY_URL" ]; then
    echo "❌ Could not get deployment URL."
    echo "Please check the deployment status with: railway status"
    echo "Once deployed, you can get the URL with: railway service open --url"
    exit 1
fi

echo "Deployment URL: $RAILWAY_URL"

# Test the deployment
echo "========================================"
echo "Testing the deployment..."
if ./scripts/test-railway-deployment.sh "$RAILWAY_URL"; then
    echo "✅ Deployment tests passed"
else
    echo "⚠️ Some deployment tests failed."
    echo "Please check the logs with: railway logs"
fi

# Final instructions
echo "========================================"
echo "Deployment completed!"
echo ""
echo "Next steps:"
echo "1. Verify the application is working at: $RAILWAY_URL"
echo "2. Check the logs with: railway logs"
echo "3. Monitor for any issues"
echo ""
echo "For troubleshooting, refer to test_documentation.md"
echo "========================================" 