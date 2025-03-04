# ElizaOS Technical Documentation

## Overview

ElizaOS is a multi-user platform for creating and managing AI characters. This document provides a comprehensive overview of the application architecture, focusing on hooks, routes, state management, and Supabase integration.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Supabase Integration](#supabase-integration)
3. [Custom Hooks](#custom-hooks)
4. [State Management](#state-management)
5. [Routes and Navigation](#routes-and-navigation)
6. [Deployment](#deployment)
7. [Common Issues and Solutions](#common-issues-and-solutions)

## Architecture Overview

ElizaOS follows a modern React application architecture with TypeScript for type safety. The application is structured as follows:

```
client/
├── src/
│   ├── components/     # UI components
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utility functions and API clients
│   ├── routes/         # Application routes
│   ├── types/          # TypeScript type definitions
│   └── index.tsx       # Application entry point
```

The application uses:
- **React** for the UI
- **TypeScript** for type safety
- **Tanstack Router** for routing
- **Clerk** for authentication
- **Supabase** for database and storage
- **Shadcn UI** for component styling

## Supabase Integration

### Overview

Supabase serves as the database and storage solution for ElizaOS. It's integrated with Clerk for authentication using JWT tokens.

### Key Files

1. **`client/src/lib/supabase-auth.ts`**
   - Creates a Supabase client with Clerk authentication
   - Provides functions to check ownership of resources

2. **`client/src/lib/character-api.ts`**
   - Implements CRUD operations for characters using Supabase
   - Handles error states and response formatting

### Authentication Flow

1. User authenticates with Clerk
2. Clerk provides a JWT token
3. The token is passed to Supabase in the Authorization header
4. Supabase validates the token and grants access based on Row Level Security (RLS) policies

### Code Example

```typescript
// Creating a Supabase client with Clerk authentication
export async function createSupabaseClient() {
  const clerkToken = await getUserToken();
  
  return createBrowserClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY,
    {
      global: {
        fetch: async (url, options = {}) => {
          const headers = new Headers(options?.headers);
          
          if (clerkToken) {
            headers.set('Authorization', `Bearer ${clerkToken}`);
          }
          
          return fetch(url, { ...options, headers });
        }
      }
    }
  );
}
```

## Custom Hooks

ElizaOS uses custom hooks to encapsulate and reuse logic across components. Here are the key hooks:

### 1. `useCharacter` and `useCharacters`

Located in `client/src/hooks/useCharacter.ts`, these hooks manage character data:

- **`useCharacter`**: Manages a single character's data and operations
  - Fetches, updates, and deletes a character
  - Tracks loading, updating, and deleting states
  - Handles errors
  - Checks ownership

- **`useCharacters`**: Manages multiple characters
  - Fetches all characters for the current user
  - Creates new characters
  - Tracks loading and creation states

### 2. `useCharacterForm`

Located in `client/src/hooks/useCharacterForm.ts`, this hook manages form state for character creation and editing:

- Integrates with react-hook-form and zod for validation
- Provides default values for new characters
- Converts between Character objects and form values
- Tracks saving state and errors

### 3. `useCharacterTemplates`

Located in `client/src/hooks/useCharacterTemplates.ts`, this hook manages character templates:

- Adds, updates, deletes, and renames templates
- Tracks the active template and editing state
- Integrates with the character form

### Usage Example

```tsx
function EditCharacter() {
  const { characterId } = useParams();
  const { character, isLoading, updateCharacter } = useCharacter(characterId);
  const { form, isSaving, setSaving } = useCharacterForm();
  
  const onSubmit = async (data) => {
    setSaving(true);
    await updateCharacter(data);
    setSaving(false);
  };
  
  if (isLoading) return <Spinner />;
  
  return (
    <Form form={form} onSubmit={onSubmit}>
      {/* Form fields */}
    </Form>
  );
}
```

## State Management

ElizaOS uses a combination of local component state and custom hooks for state management:

### Local Component State

Used for UI-specific state that doesn't need to be shared:
- Form field values
- Loading indicators
- Modal visibility

### Custom Hook State

Used for shared state and complex logic:
- Character data
- Authentication state
- Form validation

### Data Flow

1. **Data Fetching**: Custom hooks fetch data from Supabase
2. **Component Rendering**: Components consume data from hooks
3. **User Interaction**: Components call hook methods to update data
4. **State Updates**: Hooks update local state and Supabase
5. **Re-rendering**: Components re-render with updated data

## Routes and Navigation

ElizaOS uses Tanstack Router for routing. Key routes include:

- `/`: Home page
- `/characters`: Character listing
- `/characters/create`: Character creation
- `/characters/:id/edit`: Character editing
- `/characters/:id/chat`: Character chat interface

### Route Implementation

Routes are defined in the router configuration and implemented as React components in the `client/src/routes/` directory.

## Deployment

ElizaOS can be deployed to Railway using the provided configuration:

### Key Files

1. **`Dockerfile.railway`**: Optimized Docker configuration for Railway
2. **`railway.toml`**: Railway-specific configuration
3. **`.env.example`**: Template for environment variables
4. **`RAILWAY_DEPLOYMENT.md`**: Comprehensive deployment guide

## Common Issues and Solutions

### TypeScript Errors

**Issue**: Missing type declarations for external modules.
**Solution**: Create module declarations in `client/src/types/module-declarations.d.ts`.

### Supabase Authentication

**Issue**: JWT token not being passed to Supabase.
**Solution**: Ensure the Clerk JWT template is configured correctly and the token is included in the Authorization header.

### Form Validation

**Issue**: Form validation errors not showing.
**Solution**: Ensure the form is using the zodResolver and error messages are properly displayed.

## Development Guidelines

### Adding New Features

1. **Create Types**: Define TypeScript interfaces for new data structures
2. **Implement API Functions**: Add functions to interact with Supabase
3. **Create Custom Hooks**: Encapsulate logic in custom hooks
4. **Build UI Components**: Create reusable UI components
5. **Implement Routes**: Add routes for new features

### Code Style

- Use TypeScript for all new code
- Follow the existing pattern of custom hooks for logic
- Keep components small and focused
- Use Shadcn UI components for consistent styling

## Next Steps

The next phases of development include:

1. Refactoring the Edit Character component for better maintainability
2. Implementing the Character Loading Service
3. Creating deployment scripts for Railway
4. Implementing webhook handlers for Clerk events 