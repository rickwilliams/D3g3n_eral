# Clerk Authentication Implementation Guide

This guide outlines the steps to implement Clerk authentication in the ElizaOS project, integrated with Supabase for database access.

## Prerequisites

- ElizaOS project set up
- Supabase project created
- Clerk.com account created

## Installation Steps

### 1. Install Required Packages

```bash
# Install Clerk React SDK
pnpm add @clerk/clerk-react

# Install Supabase SSR library (required for proper authentication)
pnpm add @supabase/ssr

# Optional: Install types for Express (for webhook endpoint)
pnpm add --save-dev @types/express
```

### 2. Set Up Environment Variables

Add the following environment variables to your `.env` file:

```
# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_****
CLERK_SECRET_KEY=sk_****
VITE_CLERK_SIGN_IN_URL=/sign-in
VITE_CLERK_SIGN_UP_URL=/sign-up
VITE_CLERK_AFTER_SIGN_IN_URL=/
VITE_CLERK_AFTER_SIGN_UP_URL=/

# Supabase Configuration
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Configure Clerk Dashboard

1. Create a new application in Clerk
2. Set up authentication methods (email, social providers, etc.)
3. Configure JWT templates for Supabase:
   - Go to JWT Templates in Clerk dashboard
   - Add a new template named "supabase"
   - Use the following template:

```json
{
  "sub": "{{user.id}}",
  "aud": "authenticated",
  "role": "authenticated",
  "iss": "https://api.clerk.dev/v1/",
  "exp": "{{jwt.exp}}",
  "iat": "{{jwt.iat}}"
}
```

4. Set up webhook endpoint:
   - Go to Webhooks in Clerk dashboard
   - Add a new webhook endpoint with URL: `https://your-api-url/webhooks/clerk`
   - Select events: `user.created`, `user.updated`, `user.deleted`

### 4. Update Database Schema

Run the SQL schema updates to add support for Clerk users:

```bash
# Connect to your Supabase database
psql -h your-supabase-host -d postgres -U postgres -f packages/adapter-supabase/update-schema.sql
```

### 5. Set Up ClerkProvider in Your App

In your main application file (e.g., `App.tsx` or `main.tsx`), wrap your application with the ClerkProvider:

```tsx
import { ClerkProvider } from '@clerk/clerk-react';

// ...

function App() {
  return (
    <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
      {/* Your app components */}
    </ClerkProvider>
  );
}
```

## Usage

### User Authentication

Use the Clerk components to handle authentication:

```tsx
import { SignIn, SignUp, UserButton } from '@clerk/clerk-react';

// Sign In component
<SignIn path="/sign-in" routing="path" signUpUrl="/sign-up" redirectUrl="/" />

// Sign Up component
<SignUp path="/sign-up" routing="path" signInUrl="/sign-in" redirectUrl="/" />

// User Button (profile management)
<UserButton />
```

### Protected Routes

To protect routes that require authentication:

```tsx
import { useAuth } from '@clerk/clerk-react';

function ProtectedRoute({ children }) {
  const { isSignedIn, isLoaded } = useAuth();
  
  if (!isLoaded) {
    return <div>Loading...</div>;
  }
  
  if (!isSignedIn) {
    return <Redirect to="/sign-in" />;
  }
  
  return children;
}
```

### Working with Supabase

Use the created utility function to get a Supabase client with Clerk authentication:

```tsx
import { createSupabaseClient } from '@/lib/supabase-auth';

async function fetchUserData() {
  const supabase = await createSupabaseClient();
  
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .order('createdAt', { ascending: false });
    
  // Handle data/error
}
```

## Future Enhancements (TODO)

- [ ] Add support for organizations
- [ ] Implement role-based access control
- [ ] Add comprehensive error handling
- [ ] Create session management utilities
- [ ] Set up testing for authentication flows

## Troubleshooting

If you encounter issues:

1. Check that Clerk JWT template is configured correctly
2. Verify environment variables are properly set
3. Ensure Supabase RLS policies are working as expected
4. Check browser console for any authentication errors
5. Verify webhook endpoint is receiving events from Clerk 