#!/bin/bash
# Local Test Runner for ElizaOS
# This script runs all local tests to verify the application is ready for deployment

set -e # Exit immediately if a command exits with a non-zero status

# Display banner
echo "========================================"
echo "  ElizaOS Local Test Runner"
echo "========================================"

# Navigate to the project root
cd "$(dirname "$0")"/..

# Check Node.js version
REQUIRED_NODE_VERSION=23
CURRENT_NODE_VERSION=$(node -v | cut -d'.' -f1 | sed 's/v//')

if (( CURRENT_NODE_VERSION < REQUIRED_NODE_VERSION )); then
    echo "❌ Error: Node.js version must be $REQUIRED_NODE_VERSION or higher. Current version is $CURRENT_NODE_VERSION."
    exit 1
else
    echo "✅ Node.js version check passed"
fi

# Verify environment variables
echo "========================================"
echo "Verifying environment variables..."
if ./scripts/verify-env.sh; then
    echo "✅ Environment variable check passed"
else
    echo "❌ Environment variable check failed"
    exit 1
fi

# Run linting
echo "========================================"
echo "Running linting..."
if pnpm lint; then
    echo "✅ Linting passed"
else
    echo "❌ Linting failed"
    exit 1
fi

# Run build
echo "========================================"
echo "Running build..."
if pnpm build; then
    echo "✅ Build passed"
else
    echo "❌ Build failed"
    exit 1
fi

# Run character tests
echo "========================================"
echo "Running character tests..."
if ./scripts/runTestsWithDegen.sh; then
    echo "✅ Character tests passed"
else
    echo "❌ Character tests failed"
    exit 1
fi

# Verify Railway configuration
echo "========================================"
echo "Verifying Railway configuration..."

# Check if Dockerfile.railway exists
if [ -f "Dockerfile.railway" ]; then
    echo "✅ Dockerfile.railway exists"
else
    echo "❌ Dockerfile.railway not found"
    exit 1
fi

# Check if railway.toml exists
if [ -f "railway.toml" ]; then
    echo "✅ railway.toml exists"
else
    echo "❌ railway.toml not found"
    exit 1
fi

# Check if .env.example exists
if [ -f ".env.example" ]; then
    echo "✅ .env.example exists"
else
    echo "❌ .env.example not found"
    exit 1
fi

# Summary
echo "========================================"
echo "✅ All local tests passed!"
echo "The application is ready for deployment to Railway."
echo "To deploy, run: ./scripts/deploy-railway.sh"
echo "========================================" 