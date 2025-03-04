#!/bin/bash
# Railway Build Script for ElizaOS
# This script optimizes the build process for Railway deployment

set -e # Exit immediately if a command exits with a non-zero status

# Display banner
echo "========================================"
echo "  ElizaOS Railway Build Script"
echo "========================================"

# Set environment variables
export NODE_ENV=production
export RAILWAY_BUILD=true

# Clean up any previous builds
echo "Cleaning up previous builds..."
pnpm clean

# Install dependencies with frozen lockfile for reproducible builds
echo "Installing dependencies..."
pnpm install --frozen-lockfile

# Build the application with optimized settings
echo "Building application for production..."
pnpm build-docker

# Prune development dependencies to reduce image size
echo "Pruning development dependencies..."
pnpm prune --prod

echo "========================================"
echo "  Build completed successfully!"
echo "========================================"
echo "The application is now ready for deployment to Railway."
echo "========================================" 