#!/bin/bash
# Railway Deployment Script for ElizaOS
# This script automates the process of deploying ElizaOS to Railway

set -e # Exit immediately if a command exits with a non-zero status

# Display banner
echo "========================================"
echo "  ElizaOS Railway Deployment Script"
echo "========================================"

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "Railway CLI not found. Installing..."
    npm i -g @railway/cli
    echo "Railway CLI installed successfully."
fi

# Check if user is logged in to Railway
if ! railway whoami &> /dev/null; then
    echo "You are not logged in to Railway. Please login:"
    railway login
fi

# Verify environment variables
echo "Verifying environment variables..."
if [ ! -f .env.railway ]; then
    if [ -f .env.example ]; then
        echo "Creating .env.railway from .env.example..."
        cp .env.example .env.railway
        echo "Please edit .env.railway to set your production environment variables."
        echo "Press Enter to continue after editing, or Ctrl+C to abort."
        read
    else
        echo "Error: .env.example not found. Please create a .env.railway file manually."
        exit 1
    fi
fi

# Build the application
echo "Building application for production..."
NODE_ENV=production pnpm build-docker

# Deploy to Railway
echo "Deploying to Railway..."
railway up

# Check deployment status
echo "Checking deployment status..."
railway status

echo "========================================"
echo "  Deployment completed!"
echo "========================================"
echo "You can view your logs with: pnpm railway:logs"
echo "You can check status with: pnpm railway:status"
echo "========================================" 