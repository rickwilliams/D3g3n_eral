# Comprehensive Plan: User Character Management System

## Overview

We'll create a complete system for retrieving user-created characters from Supabase and sending UI changes back to the database. This will be implemented through the user-management-api, keeping it separate from the ElizaOS agent runtime system.

## 1. Analysis of Current Structure

Based on our exploration, we have:

- A `user-management-api` with placeholder implementations for character management
- A Supabase client setup in `packages/user-management-api/src/utils/supabase.ts`
- Existing API route skeletons in `packages/user-management-api/src/routes/characters.ts`
- A static ngrok URL for webhooks: `https://nice-partly-lizard.ngrok-free.app`

## 2. Detailed Implementation Plan

### Phase 1: Character Retrieval API

- [ ] **Complete the Character Loader Implementation**
  - [ ] Update `packages/user-management-api/src/routes/characters.ts` to implement the placeholder functions:
    - [ ] `getCharactersForUser`: Fetch all characters created by a specific user from Supabase
    - [ ] `getCharacter`: Fetch a single character by ID, checking ownership

- [ ] **Update API Configuration**
  - [ ] Ensure the API routes use the static ngrok URL base: `https://nice-partly-lizard.ngrok-free.app`
  - [ ] Modify any webhook URLs to use this static base instead of ephemeral URLs

- [ ] **Client-Side Integration**
  - [ ] Update `client/src/components/home.tsx` to fetch from `/api/characters` instead of `/agents`
  - [ ] Implement proper error handling and loading states

### Phase 2: Character Update API

- [ ] **Complete the Mutation API Methods**
  - [ ] Implement the remaining placeholder functions in the character loader:
    - [ ] `updateCharacter`: Save changes to an existing character
    - [ ] `deleteCharacter`: Remove a character from the database

- [ ] **Character Creation Flow**
  - [ ] Ensure the `createCharacter` function properly saves all fields from the UI form
  - [ ] Validate required fields and format before saving

- [ ] **Client-Side Form Integration**
  - [ ] Update `client/src/components/create-character.tsx` to send updates to `/api/characters/:id`
  - [ ] Implement optimistic UI updates with proper error handling

### Phase 3: Database Schema & Security

- [ ] **Schema Verification**
  - [ ] Verify the Supabase schema matches our character object structure
  - [ ] Add any missing fields needed for the complete character data model

- [ ] **Security Implementation**
  - [ ] Ensure all API endpoints verify user authentication via Clerk
  - [ ] Implement ownership checks before allowing changes to characters
  - [ ] Set up proper RLS (Row Level Security) in Supabase

### Phase 4: Error Handling & Validation

- [ ] **Enhanced Error Handling**
  - [ ] Implement detailed error messages and status codes
  - [ ] Create a centralized error handling middleware

- [ ] **Data Validation**
  - [ ] Add validation for character fields (name, bio, style traits, etc.)
  - [ ] Sanitize user input to prevent injection attacks

## 3. Technical Specifications

### API Endpoints

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|-------------|----------|
| `/api/characters` | GET | Get all characters for authenticated user | N/A | `{ characters: Character[] }` |
| `/api/characters/:id` | GET | Get specific character by ID | N/A | `{ character: Character }` |
| `/api/characters` | POST | Create new character | Character object | `{ character: Character }` |
| `/api/characters/:id` | PUT | Update existing character | Character object | `{ success: boolean, message: string }` |
| `/api/characters/:id` | DELETE | Delete a character | N/A | `{ success: boolean, message: string }` |

### Character Object Structure

```typescript
interface Character {
  id: string;
  userId: string;
  name: string;
  bio: string[];
  lore?: string[];
  style: {
    all: string[];
    chat?: string[];
    post?: string[];
  };
  topics?: string[];
  adjectives?: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

### Database Schema (Supabase)

```sql
CREATE TABLE characters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  bio JSONB NOT NULL,
  lore JSONB,
  style JSONB NOT NULL,
  topics JSONB,
  adjectives JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own characters" 
ON characters FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own characters" 
ON characters FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own characters" 
ON characters FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own characters" 
ON characters FOR DELETE 
USING (user_id = auth.uid());
```

## 4. Implementation Sequence

- [ ] First, implement the GET APIs to retrieve characters
- [ ] Update the Home UI to display characters from the new API
- [ ] Implement the creation/update/delete APIs
- [ ] Update the character creation/edit flow

## 5. Testing Strategy

- [ ] **Unit Tests**
  - [ ] Test each character loader function in isolation
  - [ ] Test API routes with mocked Supabase responses

- [ ] **Integration Tests**
  - [ ] Test the complete flow from API to database and back
  - [ ] Test authentication and authorization flows

- [ ] **UI Testing**
  - [ ] Test the character listing UI with various data scenarios
  - [ ] Test creation and editing flows

## 6. Separation from ElizaOS Agent System

This plan maintains a clear separation between:

1. **User Character Management** (our focus)
   - Storing and retrieving user-created characters in Supabase
   - Managing the UI for character creation and editing

2. **ElizaOS Agent System** (out of scope)
   - Loading character files at runtime for agent instantiation
   - Managing active agent instances

The only touchpoint would be providing a way to export a character definition to be loaded by ElizaOS when a user wants to chat with their character, but as you mentioned, that specific flow is out of scope for now. 