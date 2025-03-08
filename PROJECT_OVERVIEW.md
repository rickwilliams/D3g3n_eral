# ElizaOS Character Management System

## Project Overview

ElizaOS Character Management is a web application that allows users to create, manage, and interact with AI characters. The system integrates Clerk for authentication and Supabase for data storage, providing a seamless experience for users to create their own characters or interact with demo characters.

## Architecture

The application follows a modern web architecture:

- **Frontend**: React with TypeScript, using TanStack Router for navigation and TanStack Query for data fetching
- **Authentication**: Clerk for user authentication and management
- **Database**: Supabase (PostgreSQL) with Row Level Security (RLS) policies
- **Styling**: Tailwind CSS with a component-based approach

## Key Features

### Authentication

- User authentication via Clerk
- Secure JWT token handling for API requests
- Integration between Clerk and Supabase for consistent user identification

### Character Management

- **Character Creation**: Users can create their own characters with customizable attributes
- **Character Editing**: Users can update their characters' details, including name, bio, and avatar
- **Character Deletion**: Users can remove characters they've created
- **Demo Characters**: Pre-built characters (like Snoop and D3g3n_eral) available for all users

### User Interface

- Responsive grid layout for character cards
- Consistent styling across different character types
- Visual distinction between user-owned and demo characters
- Optimized avatar display with fallback for missing images

## Database Schema

The application uses a Supabase database with the following main table:

### Accounts Table

| Column     | Type      | Description                                   |
|------------|-----------|-----------------------------------------------|
| id         | UUID      | Primary key, client-generated                 |
| name       | Text      | Character name                                |
| email      | Text      | Used for identification (equals ID for demos) |
| avatarUrl  | Text      | URL to character avatar image                 |
| details    | JSONB     | Character details including bio, style, etc.  |
| user_id    | Text      | Clerk user ID who owns the character          |
| createdAt  | Timestamp | When the character was created                |
| updatedAt  | Timestamp | When the character was last updated           |

## Security Model

The application implements a comprehensive security model using Supabase Row Level Security (RLS) policies:

1. **Viewing Characters**: 
   - Authenticated users can view all characters
   - Special handling for runtime agent accounts

2. **Creating Characters**:
   - Only authenticated users can create characters
   - Users can only create characters with their own user_id

3. **Updating Characters**:
   - Users can only update characters they created

4. **Deleting Characters**:
   - Users can only delete characters they created

## Character Types and Filtering

The application handles different types of characters:

1. **Demo Characters**:
   - Built-in characters where `id === email`
   - Displayed in the "Demo Characters" section
   - Available to all users

2. **User Characters**:
   - Characters where `user_id` matches the current user's ID
   - Displayed in the "Your Characters" section
   - Only editable by their creator

## Integration with ElizaOS

The character management system is designed to work seamlessly with the broader ElizaOS ecosystem:

- Compatible with ElizaOS adapter-supabase plugin
- Supports runtime-generated client accounts
- Maintains compatibility with character files loaded at runtime (e.g., @snoop.json, @D3g3n_eral.json)
- Handles different client types (direct, auto, twitter, etc.)

## Technical Implementation Details

### UUID Generation

- UUIDs are generated on the client side using `crypto.randomUUID()`
- This ensures compatibility with the ElizaOS schema and prevents errors related to missing IDs

### Data Transformation

- Character data is transformed between the frontend format and Supabase format
- Conversion functions handle camelCase/snake_case differences
- Timestamps are properly formatted for UTC storage

### Responsive Design

- Grid layout adapts to different screen sizes:
  - 2 columns on mobile devices
  - 3 columns on small-medium screens
  - 4 columns on medium screens
  - 5 columns on large screens (20% width)

## Future Enhancements

Potential areas for future development:

1. Enhanced character creation with AI-assisted features
2. More sophisticated character filtering and search
3. Integration with additional ElizaOS plugins
4. Improved avatar management with upload capabilities
5. Character sharing and collaboration features

## Development Guidelines

When working on this project, follow these guidelines:

1. Maintain compatibility with the ElizaOS adapter-supabase schema
2. Ensure proper error handling for all API requests
3. Keep the UI consistent across different sections
4. Test thoroughly with different user scenarios
5. Consider the impact of changes on existing data 