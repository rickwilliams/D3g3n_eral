# ElizaOS Clerk Implementation Plan (Extended)

## Overview

This extended implementation plan details the integration of Clerk authentication with ElizaOS, focusing on:
1. Creating a separate user management server
2. Integrating Clerk in the client
3. Connecting to existing Supabase database with RLS

The implementation prioritizes getting a working demo before adding advanced features.

## Quick Start

To start the entire application with all required components:

```bash
# This single command starts:
# 1. The main ElizaOS server with the D3g3n_eral character
# 2. The User Management API server
# 3. An ngrok tunnel pointing to the User Management API
pnpm startApp
```

This script handles starting all components in the correct order and provides cleanup when stopped with Ctrl+C.

### Testing Webhooks

To test Clerk webhooks with the User Management API:

1. Start the application using `pnpm startApp`
2. Note the ngrok URL displayed in the console
3. Use one of the following methods to test webhooks:

#### Method 1: Using the test endpoint (development only)
```bash
cd packages/user-management-api
pnpm test-webhook-simple
```

This endpoint `/api/test/webhooks/clerk` bypasses signature verification and is available only in development mode.

#### Method 2: Using the production endpoint with proper signature verification
```bash
cd packages/user-management-api
pnpm test-webhook
```

The production endpoint `/api/webhooks/clerk` requires proper Svix signature headers.

#### Method 3: Using Clerk Dashboard
Configure a webhook in the Clerk Dashboard pointing to:
```
https://[your-ngrok-domain].ngrok-free.app/api/webhooks/clerk
```

## Phase 1: Environment Setup & Configuration

## Phase 6: Testing and Troubleshooting

### 6.1 Common Issues and Solutions

#### Server Connection Issues
- **Server not accessible at localhost:4000**: 
  - Symptoms: ECONNREFUSED when trying to connect to localhost:4000
  - Potential causes: Firewall, port already in use, server binding to wrong interface
  - Solutions:
    1. Use direct ngrok URL for webhook testing instead of localhost
    2. Modify test-webhook.ts to use the ngrok URL:
       ```typescript
       // Replace this
       const response = await axios.post('http://localhost:4000/api/webhooks/clerk', ...
       
       // With this
       const response = await axios.post('https://your-ngrok-url.ngrok-free.app/api/webhooks/clerk', ...
       ```
    3. Check firewall settings to ensure they allow connections to port 4000
    4. Verify the server is binding to correct interface:
       ```typescript
       app.listen(PORT, '0.0.0.0', () => {
         console.log(`User Management API running on port ${PORT}`);
       });
       ```

#### Alternative Testing Approach
If the webhook test fails due to connection issues, you can proceed with client-side testing:
1. Start the client application:
   ```bash
   pnpm start --characters="characters/D3g3n_eral.json"
   ```
2. Test user authentication through the client UI
3. Verify that client-side authentication works correctly
4. Set up webhook directly in Clerk dashboard pointing to your ngrok URL

### 6.2 Test Authentication Flow 