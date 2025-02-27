# User Management API

## Overview
The User Management API is a critical component of the ElizaOS platform, serving as the bridge between Clerk authentication and the Supabase database. This Express.js server handles webhook events from Clerk, synchronizes user data to Supabase, and ensures that authentication state is properly maintained across the system.

## Architecture
This service follows a webhook-driven architecture where:

1. Clerk authentication service manages user registration, login, and sessions
2. This Express.js API receives webhook notifications when user events occur
3. User data is synchronized to the Supabase database for persistent storage
4. JWT tokens from Clerk are configured to work with Supabase Row-Level Security

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │
│   Client    │────▶│    Clerk    │────▶│ User Mgmt   │
│  (React.js) │     │ (Auth SaaS) │     │    API      │
│             │     │             │     │ (Express.js)│
└─────────────┘     └─────────────┘     └──────┬──────┘
       ▲                                       │
       │                                       ▼
       │                                ┌─────────────┐
       │                                │             │
       └────────────────────────────────│  Supabase   │
                                        │ (Database)  │
                                        │             │
                                        └─────────────┘
```

## Key Files and Directories

- `src/index.ts` - Main Express.js server setup
- `src/webhooks/clerk.ts` - Webhook handler for Clerk events
- `src/utils/supabase.ts` - Supabase client initialization
- `src/test-webhook-simple.ts` - Automated webhook testing utility
- `src/test-webhook.ts` - Advanced webhook testing with signature verification
- `.env` - Environment configuration (see Configuration section)

## Configuration

The API requires the following environment variables to be set in a `.env` file:

```
# Clerk webhook secret - found in Clerk dashboard under Webhooks
CLERK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGci...xxxxx

# API port
USER_API_PORT=4000  # Default is 4000 if not specified
```

## Clerk JWT Configuration

For Row-Level Security in Supabase to work properly, you must configure a custom JWT template in the Clerk dashboard. The JWT must contain the following critical fields:

```json
{
  "aud": "authenticated",
  "role": "authenticated",
  "email": "{{user.primary_email_address}}",
  "user_id": "{{user.id}}",
  "app_metadata": {
    "provider": "clerk"
  }
}
```

**IMPORTANT:** The `sub` claim is protected in Clerk and cannot be customized. Supabase RLS policies must use `auth.jwt() ->> 'user_id'` instead of `auth.uid()` for row-level security rules.

## Database Schema

The API interacts with the following table structure in Supabase:

```sql
CREATE TABLE public.accounts (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    name TEXT,
    username TEXT,
    avatarUrl TEXT,
    user_id TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

-- Create policy for users to see only their own data
CREATE POLICY "Users can only view their own accounts"
ON public.accounts
FOR SELECT
USING (auth.jwt() ->> 'user_id' = user_id);

-- Create policy for users to update only their own data
CREATE POLICY "Users can only update their own accounts"
ON public.accounts
FOR UPDATE
USING (auth.jwt() ->> 'user_id' = user_id);
```

## Implementation Details

### Webhook Processing

The webhook handler processes the following Clerk events:

1. `user.created`: When a new user signs up via Clerk
   - Creates a new record in the `accounts` table
   - Maps Clerk user fields to the database schema
   - Uses Clerk `user_id` for Row-Level Security

2. `user.updated`: When user details are updated in Clerk
   - Updates corresponding record in Supabase
   - Ensures data consistency between systems

3. `user.deleted`: When a user is deleted in Clerk
   - Removes user data from Supabase

Example webhook payload structure:
```json
{
  "type": "user.created",
  "data": {
    "id": "user_2RkLhYZJtQgJfFs9HRa6Xqj1vH7",
    "email_addresses": [
      {
        "email_address": "user@example.com"
      }
    ],
    "first_name": "John",
    "last_name": "Doe",
    "username": "johndoe",
    "image_url": "https://img.clerk.com/avatar.jpg"
  }
}
```

### Webhook Security

Webhook payloads are verified using the Svix library and the `CLERK_WEBHOOK_SECRET` to ensure they come from Clerk. The verification checks:

1. `svix-id`: Unique identifier for the webhook request
2. `svix-timestamp`: When the webhook was sent
3. `svix-signature`: Cryptographic signature for verification

The API returns appropriate status codes:
- `400` for missing or invalid webhook signatures
- `500` for server-side errors
- `200` for successful processing

### Development Test Endpoints

In development mode, the API exposes a test endpoint at `/api/test/webhooks/clerk` that bypasses signature verification. This allows for local testing without needing to generate valid signatures.

## Scripts and Usage

The package includes the following scripts:

- `pnpm build` - Compiles TypeScript code using tsup
- `pnpm start` - Starts the production server
- `pnpm dev` - Starts the development server with hot reloading
- `pnpm test-webhook` - Advanced webhook testing utility
- `pnpm test-webhook-simple` - Simplified webhook testing with auto-detection

### Starting the API

```bash
# Development mode with hot reloading
pnpm dev

# Production mode
pnpm build
pnpm start
```

### Testing Webhooks

The package includes a robust webhook testing utility that:

1. Automatically detects ngrok URLs (both free and paid accounts)
2. Verifies the local API server is running
3. Checks the ngrok tunnel is working correctly
4. Sends a test webhook to simulate a user creation event
5. Logs detailed responses and errors

Run the test with:

```bash
pnpm test-webhook-simple
```

Or specify a specific ngrok URL:

```bash
pnpm test-webhook-simple https://your-ngrok-url.ngrok-free.app
```

## Troubleshooting

### Common Issues

1. **Webhook Verification Failures**
   - Check that `CLERK_WEBHOOK_SECRET` is correctly set in `.env`
   - Ensure webhook URLs in Clerk dashboard match your ngrok URL

2. **Database Connection Issues**
   - Verify `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` are correct
   - Check Supabase console for table structure and permissions

3. **Ngrok Issues**
   - Ensure ngrok is running (`ngrok http 4000`)
   - Check for URL pattern changes (free accounts use *.ngrok-free.app)
   - Verify the tunnel is active in the ngrok dashboard (http://localhost:4040)

4. **JWT Format Errors**
   - Confirm JWT template is correctly configured in Clerk dashboard
   - Check that `user_id` field is correctly mapped to Clerk user ID
   - Verify RLS policies use `auth.jwt() ->> 'user_id'` pattern

### Logging

All webhook tests save detailed logs to the `logs/` directory with timestamps for easy troubleshooting.

## Related Documentation

For more information on the integration between Clerk and Supabase, refer to:

- [Clerk-Supabase Integration Guide](../../rules/clerk-supabase-integration.mdc)
- [Ngrok Webhook Testing Best Practices](../../rules/ngrok-webhook-testing.mdc)

## Dependencies

- **Express.js** - Web server framework
- **Svix** - Webhook verification library
- **@supabase/supabase-js** - Supabase client
- **axios** - HTTP client for webhook testing
- **dotenv** - Environment variable management
- **cors** - Cross-Origin Resource Sharing middleware
- **TypeScript** - Type-safe JavaScript superset
- **tsup** - TypeScript bundler 