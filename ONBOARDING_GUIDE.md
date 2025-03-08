# ElizaOS Character Management System - Onboarding Guide

Welcome to the ElizaOS Character Management System project! This guide will help you get up to speed with the codebase, architecture, and development workflow. By the end of this document, you should have a good understanding of how the system works and where to find key components.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Getting Started](#getting-started)
3. [Codebase Structure](#codebase-structure)
4. [Key Components](#key-components)
5. [Authentication Flow](#authentication-flow)
6. [Database Integration](#database-integration)
7. [Character Management](#character-management)
8. [UI Components](#ui-components)
9. [Development Workflow](#development-workflow)
10. [Common Tasks](#common-tasks)
11. [Troubleshooting](#troubleshooting)

## Project Overview

ElizaOS Character Management is a web application that allows users to create, manage, and interact with AI characters. The system integrates Clerk for authentication and Supabase for data storage. For a comprehensive overview of the project, please refer to the [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) file.

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn
- Supabase account and project
- Clerk account and project

### Local Development Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   cd elizaOS-v0.25.8
   npm install
   ```
3. Set up environment variables (see `.env.example`)
4. Start the development server:
   ```bash
   npm run dev
   ```

## Codebase Structure

The project follows a standard React application structure with TypeScript:

```
client/
├── public/              # Static assets
│   ├── snoop.jpg        # Demo character avatar
│   └── D3g3n_eral.jpg   # Demo character avatar
├── src/
│   ├── components/      # Reusable UI components
│   │   ├── ui/          # Base UI components
│   │   └── auth/        # Authentication components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Core functionality and utilities
│   │   ├── api.ts       # API client
│   │   ├── character-api.ts  # Character management
│   │   └── supabase-client.ts # Database connectivity
│   ├── routes/          # Application routes/pages
│   │   ├── home.tsx     # Home page with character grid
│   │   ├── chat.tsx     # Character chat interface
│   │   └── edit-character.tsx # Character editing
│   ├── types/           # TypeScript type definitions
│   │   └── character.ts # Character data structures
│   ├── App.tsx          # Main application component
│   └── main.tsx         # Application entry point
```

## Key Components

### Core Files

- **App.tsx**: Main application component that sets up routing, authentication, and global UI elements
- **character-api.ts**: Core functions for character CRUD operations
- **supabase-client.ts**: Handles database connectivity and authentication with Supabase
- **home.tsx**: Main dashboard showing character grids for demo and user characters

### Type Definitions

The application uses TypeScript with Zod for runtime validation. Key types include:

- **Character**: Full character model with all properties
- **CharacterSummary**: Simplified character model for list views
- **CharacterFormValues**: Form input structure for creating/editing characters

## Authentication Flow

The application uses Clerk for authentication and integrates with Supabase using JWT tokens:

1. User signs in via Clerk (sign-in.tsx)
2. App.tsx sets up token retrieval globally using setupTokenRetrieval
3. JWT tokens are passed to Supabase for authenticated requests
4. Row Level Security (RLS) policies in Supabase enforce access control

Key files:
- **App.tsx**: Sets up authentication
- **supabase-client.ts**: Handles token management
- **auth-provider.tsx**: Provides authentication context

## Database Integration

Supabase is used as the backend database with PostgreSQL:

1. **createSupabaseClient()**: Creates an authenticated Supabase client
2. **RLS Policies**: Control access to the accounts table
3. **Data Transformation**: Functions convert between frontend and database formats

Key files:
- **supabase-client.ts**: Client setup and authentication
- **character-api.ts**: Database operations

## Character Management

Characters are managed through a set of API functions in character-api.ts:

- **getCharacters()**: Fetches all characters with filtering logic
- **getCharacter()**: Fetches a single character by ID
- **createCharacter()**: Creates a new character
- **updateCharacter()**: Updates an existing character
- **deleteCharacter()**: Deletes a character

Character filtering logic:
- **Demo Characters**: Where id === email
- **User Characters**: Where user_id matches current user's ID

## UI Components

The UI is built with React components using Tailwind CSS:

- **Card Components**: Display characters in a responsive grid
- **Form Components**: Handle character creation and editing
- **Layout Components**: Manage overall page structure

Key UI features:
- Responsive grid layout (2-5 columns based on screen size)
- Consistent card styling across character types
- Avatar display with fallback for missing images

## Development Workflow

### Adding a New Feature

1. Understand the requirements
2. Identify the components that need to be modified
3. Make changes to the relevant files
4. Test locally
5. Submit a pull request

### Modifying Character Behavior

1. Update the relevant functions in character-api.ts
2. Ensure type safety with character.ts definitions
3. Update UI components as needed
4. Test with both demo and user-created characters

## Common Tasks

### Adding a New Character Field

1. Update the character schema in types/character.ts
2. Modify the form components in components/create-character.tsx and components/edit-character.tsx
3. Update the character-api.ts functions to handle the new field
4. Test creation and editing with the new field

### Modifying the UI Layout

1. Update the grid layout in routes/home.tsx
2. Ensure responsive behavior across different screen sizes
3. Maintain consistent styling between demo and user characters

## Troubleshooting

### Authentication Issues

- Check browser console for token retrieval errors
- Verify Clerk and Supabase configuration
- Ensure JWT template is set up correctly

### Database Access Problems

- Verify RLS policies in Supabase
- Check user_id matching in queries
- Confirm JWT token is being passed correctly

### UI Rendering Issues

- Check component props and data flow
- Verify responsive breakpoints
- Inspect element styling with browser dev tools

---

This onboarding guide should help you get started with the ElizaOS Character Management System. If you have any questions, feel free to reach out to the team! 