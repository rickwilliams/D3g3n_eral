# ElizaOS Testing Documentation

This document provides an overview of the testing approach for ElizaOS, focusing on ensuring a successful deployment to Railway.

## Table of Contents

1. [Testing Overview](#testing-overview)
2. [Local Testing](#local-testing)
3. [Railway Deployment Testing](#railway-deployment-testing)
4. [Troubleshooting](#troubleshooting)
5. [Future Test Enhancements](#future-test-enhancements)

## Testing Overview

The testing approach for ElizaOS focuses on:

1. **Core Functionality**: Ensuring the character functionality and agent runtime work correctly
2. **Environment Configuration**: Verifying all required environment variables are set
3. **Deployment Verification**: Testing the Railway deployment to ensure it's working correctly

The test suite is designed to be lightweight and focused on ensuring a successful deployment rather than comprehensive test coverage.

## Local Testing

### Prerequisites

- Node.js 23 or higher
- pnpm installed
- D3g3n_eral character file in the `characters` directory

### Running Core Functionality Tests

To test the core character functionality:

```bash
# Run tests with the D3g3n_eral character
./scripts/runTestsWithDegen.sh
```

This script:
1. Verifies Node.js version
2. Sets up the D3g3n_eral character
3. Runs the test1.mjs file with the character

### Verifying Environment Variables

To verify that all required environment variables are set:

```bash
# Check current environment
./scripts/verify-env.sh

# Check a specific .env file
./scripts/verify-env.sh --env-file .env.local
```

This script checks for all required environment variables for both local development and Railway deployment.

### Running the Application Locally

To run the application locally with the D3g3n_eral character:

```bash
# Start the application with all components
./scripts/MyApp.sh
```

This script:
1. Starts the User Management API
2. Sets up an ngrok tunnel for webhook testing
3. Starts the main ElizaOS application with the D3g3n_eral character

## Railway Deployment Testing

### Preparing for Deployment

Before deploying to Railway:

1. Verify environment variables:
   ```bash
   ./scripts/verify-env.sh --env-file .env.railway
   ```

2. Ensure the Railway CLI is installed and you're logged in:
   ```bash
   # Install Railway CLI if needed
   npm i -g @railway/cli
   
   # Login to Railway
   railway login
   ```

### Deploying to Railway

To deploy the application to Railway:

```bash
# Deploy using the deployment script
./scripts/deploy-railway.sh
```

This script:
1. Verifies Railway CLI installation and login
2. Checks environment variables
3. Builds the application for production
4. Deploys to Railway
5. Checks deployment status

### Testing the Deployment

After deployment, test the Railway deployment:

```bash
# Test the deployment
./scripts/test-railway-deployment.sh https://your-app-name.railway.app
```

This script tests:
1. Health endpoints
2. API endpoints
3. Authentication requirements
4. Webhook endpoint configuration

### Manual Testing Checklist

After automated testing, perform these manual tests:

1. **Authentication**:
   - Sign up as a new user
   - Sign in with an existing user
   - Verify JWT token is passed to Supabase correctly

2. **Character Management**:
   - Create a new character
   - Edit an existing character
   - Delete a character
   - Verify character ownership restrictions

3. **Supabase Integration**:
   - Verify data is stored in Supabase correctly
   - Check Row Level Security policies are working

## Troubleshooting

### Common Issues

#### Node.js Version

If you see errors related to Node.js version:

```
Error: Node.js version must be 23 or higher
```

Update your Node.js installation:

```bash
# Using nvm
nvm install 23
nvm use 23
```

#### Environment Variables

If environment variables are missing:

1. Check your `.env` file
2. Run `./scripts/verify-env.sh` to see which variables are missing
3. Add the missing variables to your environment or `.env` file

#### Railway Deployment Issues

If deployment to Railway fails:

1. Check Railway logs:
   ```bash
   railway logs
   ```

2. Verify environment variables in Railway:
   ```bash
   railway variables
   ```

3. Check for build errors:
   ```bash
   railway status
   ```

#### Webhook Issues

If webhooks aren't working:

1. Verify the ngrok tunnel is running (for local development)
2. Check the webhook URL in the Clerk dashboard
3. Verify the webhook secret is set correctly

## Future Test Enhancements

For future development, consider enhancing the test suite with:

1. **Unit Tests**: Add unit tests for individual components and functions
2. **Integration Tests**: Add more comprehensive integration tests
3. **End-to-End Tests**: Add end-to-end tests for critical user flows
4. **Automated UI Testing**: Add tests for the frontend components
5. **CI/CD Integration**: Integrate tests with a CI/CD pipeline

These enhancements would provide more comprehensive test coverage but are not necessary for the current deployment focus. 