# ElizaOS Technical Documentation

## Overview

ElizaOS is a multi-user platform for creating and managing AI characters. This document provides a comprehensive overview of the application architecture, focusing on hooks, routes, state management, and Supabase integration.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Supabase Integration](#supabase-integration)
3. [Custom Hooks](#custom-hooks)
4. [State Management](#state-management)
5. [Routes and Navigation](#routes-and-navigation)
6. [Component Architecture](#component-architecture)
7. [Character Loading Service](#character-loading-service)
8. [API Endpoints](#api-endpoints)
9. [Deployment](#deployment)
10. [Common Issues and Solutions](#common-issues-and-solutions)

## Architecture Overview

ElizaOS follows a modern React application architecture with TypeScript for type safety. The application is structured as follows:

```
client/
├── src/
│   ├── components/     # UI components
│   │   └── character/  # Character-specific components
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utility functions and API clients
│   ├── routes/         # Application routes
│   ├── types/          # TypeScript type definitions
│   └── index.tsx       # Application entry point
packages/
├── core/               # Core functionality and services
│   ├── src/
│   │   ├── characterLoader.ts  # Character loading service
│   │   ├── logger.ts           # Logging utility
│   │   ├── supabase.ts         # Supabase client utilities
│   │   └── types.ts            # Shared type definitions
├── user-management-api/  # User management API
│   ├── src/
│   │   ├── routes/
│   │   │   └── characters.ts   # Character API endpoints
│   │   ├── webhooks/
│   │   │   └── clerk.ts        # Clerk webhook handler
│   │   └── index.ts            # API entry point
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

3. **`packages/core/src/supabase.ts`**
   - Provides utilities for creating Supabase clients
   - Includes functions for admin and user-specific clients

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

## Component Architecture

ElizaOS follows a modular component architecture, breaking down complex UI elements into smaller, reusable components.

### Character Components

The character editing functionality has been refactored into smaller, focused components:

1. **`EditCharacterForm`** (`client/src/components/edit-character.tsx`)
   - Main container component for editing a character
   - Manages form state and submission
   - Handles character deletion
   - Organizes the UI into tabs

2. **`CharacterBasicInfo`** (`client/src/components/character/CharacterBasicInfo.tsx`)
   - Handles basic character information (name, avatar, bio, lore)
   - Manages avatar file uploads
   - Provides form fields for character details

3. **`CharacterStyleConfig`** (`client/src/components/character/CharacterStyleConfig.tsx`)
   - Manages character style settings
   - Handles topics and adjectives selection
   - Provides form fields for style configuration

4. **`CharacterIntegrations`** (`client/src/components/character/CharacterIntegrations.tsx`)
   - Manages character integrations (clients, plugins)
   - Handles knowledge file selection
   - Provides form fields for integration configuration

5. **`CharacterTemplates`** (`client/src/components/character/CharacterTemplates.tsx`)
   - Manages character templates
   - Provides UI for adding, editing, and deleting templates
   - Handles template content editing

### Benefits of Component Refactoring

- **Improved Maintainability**: Smaller components are easier to understand and modify
- **Better Code Organization**: Related functionality is grouped together
- **Enhanced Reusability**: Components can be reused in different contexts
- **Simplified Testing**: Smaller components are easier to test in isolation
- **Reduced Cognitive Load**: Developers can focus on one aspect of the UI at a time

## Character Loading Service

The Character Loading Service provides a robust way to manage characters with efficient caching capabilities. It's implemented in the core package and used by the user-management API.

### Key Features

- **Efficient Caching**: Caches characters in memory to reduce database queries
- **Cache Expiration**: Automatically expires cached entries after a configurable time
- **Cache Size Limit**: Limits the maximum number of cached characters
- **Type Safety**: Uses TypeScript interfaces for type safety
- **Error Handling**: Comprehensive error handling and logging

### Implementation

The Character Loading Service is implemented in `packages/core/src/characterLoader.ts`:

```typescript
export class CharacterLoader {
  private cache: Map<string, CharacterCacheEntry> = new Map();
  private cacheExpirationMs: number;
  private maxCacheSize: number;
  private supabaseUrl: string;
  private supabaseAnonKey: string;

  constructor(options: CharacterLoaderOptions = {}) {
    // Initialize with default or provided options
  }

  async getCharacter(characterId: UUID, userId: string, skipCache = false): Promise<ExtendedCharacter | null> {
    // Get character from cache or database
  }

  async getCharactersForUser(userId: string): Promise<ExtendedCharacter[]> {
    // Get all characters for a user
  }

  async createCharacter(character: Omit<ExtendedCharacter, 'id'>, userId: string): Promise<ExtendedCharacter | null> {
    // Create a new character
  }

  async updateCharacter(characterId: UUID, character: Partial<ExtendedCharacter>, userId: string): Promise<boolean> {
    // Update an existing character
  }

  async deleteCharacter(characterId: UUID, userId: string): Promise<boolean> {
    // Delete a character
  }

  async isCharacterOwner(characterId: UUID, userId: string): Promise<boolean> {
    // Check if a user owns a character
  }

  async isCharacterPublic(characterId: UUID): Promise<boolean> {
    // Check if a character is public
  }

  clearCache(): void {
    // Clear the cache
  }

  // Private helper methods
}
```

### Usage

The Character Loading Service is used by the user-management API to handle character operations:

```typescript
import { characterLoader } from '@elizaos/core/characterLoader';

// Get a character
const character = await characterLoader.getCharacter(characterId, userId);

// Update a character
const success = await characterLoader.updateCharacter(characterId, updatedCharacter, userId);
```

## API Endpoints

The user-management API provides RESTful endpoints for managing characters. These endpoints are implemented in `packages/user-management-api/src/routes/characters.ts`.

### Character Endpoints

#### Get All Characters for User

```
GET /api/characters
```

Returns all characters owned by the authenticated user.

#### Get Character by ID

```
GET /api/characters/:id
```

Returns a specific character by ID if the user has access to it.

#### Create Character

```
POST /api/characters
```

Creates a new character for the authenticated user.

#### Update Character

```
PUT /api/characters/:id
```

Updates an existing character if the user owns it.

#### Delete Character

```
DELETE /api/characters/:id
```

Deletes a character if the user owns it.

### Implementation

The character routes are implemented using Express.js and the Character Loading Service:

```typescript
import express from 'express';
import { characterLoader } from '@elizaos/core/characterLoader';
import { logger } from '@elizaos/core/logger';

const router = express.Router();

// Get all characters for the authenticated user
router.get('/', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const characters = await characterLoader.getCharactersForUser(userId);
    return res.status(200).json({ characters });
  } catch (error) {
    logger.error(`Error fetching characters: ${error instanceof Error ? error.message : String(error)}`);
    return res.status(500).json({ error: 'Failed to fetch characters' });
  }
});

// Additional routes for CRUD operations
```

### Webhook Handler

The API also includes a webhook handler for Clerk authentication events:

```typescript
import { Request, Response } from 'express';
import { Webhook } from 'svix';
import { createSupabaseAdmin } from '../utils/supabase.js';

export function createClerkWebhookHandler() {
  return async (req: Request, res: Response) => {
    // Verify webhook signature
    // Process webhook event
    // Update Supabase database
  };
}
```

## Deployment

ElizaOS can be deployed to Railway using the provided configuration:

### Key Files

1. **`Dockerfile.railway`**: Optimized Docker configuration for Railway with multi-stage build process
2. **`railway.toml`**: Railway-specific configuration for build, deploy, and environment settings
3. **`.env.example`**: Template for environment variables required for production deployment
4. **`RAILWAY_DEPLOYMENT.md`**: Comprehensive deployment guide with step-by-step instructions
5. **`scripts/deploy-railway.sh`**: Automated deployment script for Railway
6. **`scripts/railway-build.sh`**: Optimized build script for Railway deployment

### Deployment Configuration

The deployment configuration has been completed with the following components:

1. **Multi-stage Docker Build**: The `Dockerfile.railway` implements a multi-stage build process to optimize the Docker image size and improve deployment efficiency.

2. **Railway Configuration**: The `railway.toml` file configures the build and deployment process, including health checks and restart policies.

3. **Environment Variables**: The `.env.example` file provides a template for all required environment variables for production deployment.

4. **Deployment Documentation**: The `RAILWAY_DEPLOYMENT.md` file provides comprehensive instructions for deploying ElizaOS on Railway, including prerequisites, environment setup, and troubleshooting guidance.

### Deployment Scripts

The following scripts have been implemented to simplify the Railway deployment process:

1. **`scripts/deploy-railway.sh`**: A comprehensive deployment script that:
   - Checks for Railway CLI installation
   - Verifies user authentication with Railway
   - Sets up environment variables
   - Builds the application
   - Deploys to Railway
   - Checks deployment status

2. **`scripts/railway-build.sh`**: An optimized build script that:
   - Cleans up previous builds
   - Installs dependencies with frozen lockfile
   - Builds the application with production settings
   - Prunes development dependencies to reduce image size

### Package.json Scripts

The following scripts have been added to `package.json` to facilitate Railway deployment:

```json
{
  "railway:deploy": "railway up",
  "railway:env": "railway env",
  "railway:logs": "railway logs",
  "railway:status": "railway status",
  "railway:variables": "railway variables",
  "railway:build": "NODE_ENV=production pnpm build-docker",
  "railway:build:optimized": "bash ./scripts/railway-build.sh",
  "deploy:railway": "pnpm railway:build && pnpm railway:deploy",
  "deploy:railway:script": "bash ./scripts/deploy-railway.sh",
  "deploy:railway:optimized": "pnpm railway:build:optimized && pnpm railway:deploy"
}
```

### Deployment Process

To deploy ElizaOS to Railway, you can use one of the following methods:

1. **Basic Deployment**:
   ```bash
   pnpm deploy:railway
   ```

2. **Using the Deployment Script**:
   ```bash
   pnpm deploy:railway:script
   ```

3. **Optimized Deployment**:
   ```bash
   pnpm deploy:railway:optimized
   ```

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

### Component Refactoring

**Issue**: Type errors with `UseFormReturn` from react-hook-form.
**Solution**: Use `any` type temporarily and add proper type definitions later, or import from the correct location.

**Issue**: Props type mismatches in UI components.
**Solution**: Check the component documentation for the correct prop names and types.

### Character Loading Service

**Issue**: Characters not being cached properly.
**Solution**: Check that the cache expiration time is set correctly and that the cache is being cleared when needed.

**Issue**: Type errors with the Character interface.
**Solution**: Ensure that the ExtendedCharacter interface includes all required fields from the Character interface.

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

1. Creating deployment scripts for Railway (Phase 5.2)
2. Implementing webhook handler for Clerk events (Phase 6)
3. Testing and deployment (Phase 7)
4. Documentation and cleanup (Phase 8)

With the Character Loading Service and API endpoints now fully implemented, the focus shifts to optimizing the deployment process and implementing the webhook handler for Clerk events. The deployment scripts will simplify the process of deploying to Railway, while the webhook handler will ensure proper synchronization between Clerk and Supabase. 