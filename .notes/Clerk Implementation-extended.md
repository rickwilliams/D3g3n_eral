# ElizaOS Clerk Implementation Plan (Extended)

## Overview

This extended implementation plan details the integration of Clerk authentication with ElizaOS, focusing on:
1. Creating a separate user management server
2. Integrating Clerk in the client
3. Connecting to existing Supabase database with RLS

The implementation prioritizes getting a working demo before adding advanced features.

## Phase 1: Environment Setup & Configuration

### 1.1 Install Required Dependencies
- [x] Install Clerk React SDK:
  ```bash
  cd client
  pnpm add @clerk/clerk-react
  ```
- [x] Install Express for user management server:
  ```bash
  pnpm add express cors dotenv svix
  ```

### 1.2 Set Up Environment Variables
- [x] Configure Clerk environment variables (already in .env)
- [x] Configure Supabase environment variables (already in .env)
- [x] Add user management API port:
  ```
  USER_API_PORT=4000
  ```

### 1.3 Create JWT Template in Clerk Dashboard
- [x] Set up JWT template in Clerk Dashboard with Supabase format:
  ```json
  {
    "sub": "{{user.id}}",
    "aud": "authenticated",
    "role": "authenticated",
    "iss": "https://api.clerk.dev/v1/",
    "exp": "{{exp}}",
    "user_id": "{{user.id}}"
  }
  ```

## Phase 2: User Management Server

### 2.1 Create Server Structure
- [x] Create directory for user management server
- [x] Create package.json with dependencies
- [x] Create tsconfig.json and tsup.config.ts for bundling

### 2.2 Create Basic Server
- [x] Create src/index.ts with basic Express setup
- [x] Implement health check endpoint
- [x] Configure CORS for client access

### 2.3 Create Clerk Webhook Handler
- [x] Create src/webhooks/clerk.ts for handling Clerk events
- [x] Implement webhook signature verification
- [x] Create handlers for user.created, user.updated, and user.deleted events

### 2.4 Create Supabase Admin Utility
- [x] Create src/utils/supabase.ts for Supabase admin operations
- [x] Implement secure client creation with service key

### 2.5 Create Webhook Test Utility
- [x] Create test-webhook.ts for simulating webhook events
- [x] Implement proper signature generation for testing

## Phase 3: Client-Side Authentication

### 3.1 Create Authentication Utilities
- [x] Create client/src/lib/auth.ts with Clerk utilities
- [x] Implement getClerkPublishableKey function
- [x] Implement createSupabaseClient with token injection
- [x] Create useSupabaseToken hook for client-side token management

### 3.2 Set Up ClerkProvider in Client
- [x] Create client/src/providers/ClerkProvider.tsx
- [x] Implement proper provider configuration

### 3.3 Update Main App Entry Point
- [ ] Update client/src/main.tsx with ClerkProvider

### 3.4 Implement Authentication Components
- [x] Create SignIn component
- [x] Create SignUp component
- [x] Create UserButton component

### 3.5 Create Auth Route Protection
- [x] Create ProtectedRoute component for securing routes

### 3.6 Update Routes Configuration
- [ ] Update client routing to include authentication routes

## Phase 4: Supabase Integration

### 4.1 Extend Auth Hook
- [x] Create useSupabase hook for authenticated Supabase access
- [x] Fix type definitions for proper TypeScript support

### 4.2 Create User Profile Context
- [x] Create UserProfileContext for profile data management
- [x] Implement proper data fetching with error handling

## Phase 5: Testing and Deployment

### 5.1 Install Dependencies and Build
- [x] Install Clerk and Supabase dependencies in client
- [x] Install dependencies for user management server
- [ ] Build the user management server:
  ```bash
  cd packages/user-management-api
  pnpm build
  ```

### 5.2 Test Webhook Integration
- [x] Configure environment variables for webhook testing:
  ```
  CLERK_WEBHOOK_SECRET=whsec_1rXbpoSGmOPHB0zGVywZNlC64QKBVJIk
  SUPABASE_URL=https://jrmsquvlfymsgtvpcyeb.supabase.co
  SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpybXNxdXZsZnltc2d0dnBjeWViIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDAxMzExNiwiZXhwIjoyMDU1NTg5MTE2fQ.Xuht0YmHJhMo6jhp5Gr9_abW5nZZip_hXAUlC76gh7k
  USER_API_PORT=4000
  ```
- [ ] Start the user management server:
  ```bash
  cd packages/user-management-api
  pnpm start
  ```
- [ ] In a separate terminal, run the test webhook script:
  ```bash
  cd packages/user-management-api
  pnpm test-webhook
  ```

### 5.3 Test Authentication Flow
- [ ] Start the user management server (if not already running):
  ```bash
  cd packages/user-management-api
  pnpm start
  ```
- [ ] Start the client application:
  ```bash
  cd client
  pnpm dev
  ```
- [ ] Verify sign-up, sign-in, and protected routes
- [ ] Verify Supabase data access with authenticated users
- [ ] Confirm that RLS policies are working correctly

## Next Steps

After completing the implementation, the following steps are recommended:

1. **Verify JWT format**: Ensure the JWT from Clerk matches Supabase's expected format
2. **Test RLS policies**: Verify that users can only access their own data
3. **Add user profile management**: Allow users to update their profiles
4. **Improve error handling**: Add better error messages and recovery options
5. **Add monitoring**: Set up logging for authentication events

## Current Status

- ✅ Server implementation completed with TypeScript fixes
- ✅ Client-side components implemented
- ✅ Basic Supabase integration implemented
- ✅ Environment variables configured, including USER_API_PORT=4000
- ✅ Dependencies installed successfully
- 🔄 Need to build the user management server
- 🔄 Need to test the webhook integration
- 🔄 Need to test the authentication flow end-to-end

## Phase 6: Testing and Troubleshooting

### 6.1 Test Authentication Flow
- [ ] Test user registration
- [ ] Test user login
- [ ] Test JWT token passing to Supabase 
- [ ] Test user profile fetching with RLS

### 6.2 Test Webhook Integration
- [ ] Test user creation webhook
- [ ] Test user update webhook 
- [ ] Test user deletion webhook

### 6.3 Common Issues and Solutions
- [ ] CORS issues: Ensure proper CORS configuration
- [ ] JWT token format: Verify JWT template matches what Supabase expects
- [ ] RLS policies: Verify policies are correctly configured
- [ ] Environment variables: Check all required variables are set

## Deployment Checklist

### 7.1 Production Configuration
- [ ] Update environment variables for production
- [ ] Set up proper error logging
- [ ] Configure CORS for production domain
- [ ] Set up health checks for API

### 7.2 Security Considerations
- [ ] Ensure proper HTTPS configuration
- [ ] Verify rate limiting to prevent abuse
- [ ] Check secure cookie settings
- [ ] Review RLS policies for any security gaps

---

## References
- [Clerk Documentation](https://clerk.com/docs)
- [Supabase-Clerk Integration](https://clerk.com/docs/integrations/databases/supabase)
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security) 