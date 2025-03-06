# Detailed Implementation Plan for Phase 1

## Task 1.1: Create Character Type Definitions

First, let's create a comprehensive type definition for characters based on the schema from `environment.ts` and the character file format:

```typescript
// client/src/types/character.ts

import { z } from "zod";

// Define the character schema using Zod for validation
export const characterSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Character name is required"),
  bio: z.union([z.string(), z.array(z.string())]),
  lore: z.array(z.string()).optional(),
  style: z.object({
    all: z.array(z.string()),
    chat: z.array(z.string()),
    post: z.array(z.string())
  }),
  topics: z.array(z.string()).optional(),
  adjectives: z.array(z.string()).optional(),
  avatarUrl: z.string().optional(),
  clients: z.array(z.string()),
  plugins: z.array(z.string()),
  knowledge: z.array(z.string()).default([]),
  templates: z.record(z.string()).default({}),
  modelProvider: z.string().default("openai"),
  imageModelProvider: z.string().optional(),
  imageVisionModelProvider: z.string().optional(),
  settings: z.object({
    ragKnowledge: z.boolean().optional(),
    secrets: z.record(z.string()).optional(),
    voice: z.object({
      model: z.string().optional(),
      url: z.string().optional(),
    }).optional(),
    model: z.string().optional(),
    modelConfig: z.object({
      maxInputTokens: z.number().optional(),
      maxOutputTokens: z.number().optional(),
      temperature: z.number().optional(),
      frequency_penalty: z.number().optional(),
      presence_penalty: z.number().optional()
    }).optional(),
    embeddingModel: z.string().optional(),
    imageSettings: z.object({
      modelProvider: z.string().optional(),
      steps: z.number().optional(),
      width: z.number().optional(),
      height: z.number().optional(),
      cfgScale: z.number().optional(),
      negativePrompt: z.string().optional(),
    }).optional(),
  }).optional(),
  owner_id: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

// Export the type
export type Character = z.infer<typeof characterSchema>;

// Form values type (used for the edit form)
export type CharacterFormValues = Omit<Character, 'id' | 'owner_id' | 'created_at' | 'updated_at'>;

// Character summary type (used for listing characters)
export type CharacterSummary = Pick<Character, 'id' | 'name' | 'avatarUrl' | 'created_at' | 'updated_at'>;

// Validation function
export function validateCharacter(data: unknown): Character | null {
  try {
    return characterSchema.parse(data);
  } catch (error) {
    console.error('Character validation error:', error);
    return null;
  }
}
```

## Task 1.2: Implement Character API Module

Next, let's create a comprehensive API module for character operations:

```typescript
// client/src/lib/character-api.ts

import { createSupabaseClient } from './supabase-auth';
import { Character, CharacterFormValues, CharacterSummary, validateCharacter } from '../types/character';

/**
 * Get all characters for the current user
 */
export async function getCharacters(): Promise<CharacterSummary[]> {
  try {
    const supabase = await createSupabaseClient();
    if (!supabase) return [];
    
    const { data, error } = await supabase
      .from('accounts')
      .select('id, name, avatarUrl, details, created_at, updated_at')
      .eq('is_agent', true);
      
    if (error) throw error;
    
    // Map the data to the CharacterSummary type
    return data.map(item => ({
      id: item.id,
      name: item.name || (item.details?.name || 'Unnamed Character'),
      avatarUrl: item.avatarUrl || item.details?.avatarUrl,
      created_at: item.created_at,
      updated_at: item.updated_at
    }));
  } catch (error) {
    console.error('Error fetching characters:', error);
    return [];
  }
}

/**
 * Get a character by ID
 */
export async function getCharacter(characterId: string): Promise<Character | null> {
  try {
    const supabase = await createSupabaseClient();
    if (!supabase) return null;
    
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', characterId)
      .eq('is_agent', true)
      .single();
      
    if (error) throw error;
    if (!data) return null;
    
    // Combine the account data with the details
    const characterData = {
      id: data.id,
      name: data.name || '',
      avatarUrl: data.avatarUrl,
      ...data.details,
      owner_id: data.user_id,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
    
    // Validate the character data
    return validateCharacter(characterData);
  } catch (error) {
    console.error('Error fetching character:', error);
    return null;
  }
}

/**
 * Create a new character
 */
export async function createCharacter(character: CharacterFormValues): Promise<string | null> {
  try {
    const supabase = await createSupabaseClient();
    if (!supabase) return null;
    
    // Create a new account record with is_agent=true
    const { data, error } = await supabase
      .from('accounts')
      .insert({
        name: character.name,
        avatarUrl: character.avatarUrl,
        details: character,
        is_agent: true
      })
      .select('id')
      .single();
      
    if (error) throw error;
    return data.id;
  } catch (error) {
    console.error('Error creating character:', error);
    return null;
  }
}

/**
 * Update an existing character
 */
export async function updateCharacter(characterId: string, character: CharacterFormValues): Promise<boolean> {
  try {
    const supabase = await createSupabaseClient();
    if (!supabase) return false;
    
    // Update the account record
    const { error } = await supabase
      .from('accounts')
      .update({
        name: character.name,
        avatarUrl: character.avatarUrl,
        details: character
      })
      .eq('id', characterId)
      .eq('is_agent', true);
      
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating character:', error);
    return false;
  }
}

/**
 * Delete a character
 */
export async function deleteCharacter(characterId: string): Promise<boolean> {
  try {
    const supabase = await createSupabaseClient();
    if (!supabase) return false;
    
    // Delete the account record
    const { error } = await supabase
      .from('accounts')
      .delete()
      .eq('id', characterId)
      .eq('is_agent', true);
      
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting character:', error);
    return false;
  }
}

/**
 * Load a character for chat
 */
export async function loadCharacterForChat(characterId: string): Promise<boolean> {
  try {
    // This is a placeholder for the actual implementation
    // In a real implementation, this would call an API endpoint to load the character
    console.log(`Loading character ${characterId} for chat`);
    return true;
  } catch (error) {
    console.error('Error loading character for chat:', error);
    return false;
  }
}
```

## Task 1.3: Complete Supabase Integration

Finally, let's complete the Supabase integration using the SSR pattern:

```typescript
// client/src/lib/supabase-auth.ts

import { createBrowserClient } from '@supabase/ssr';
import { getUserToken } from './auth';

/**
 * Creates a Supabase client for browser usage with Clerk authentication
 * This follows the @supabase/ssr pattern as specified in the rules
 */
export async function createSupabaseClient() {
  try {
    // Get the token from Clerk for Supabase authentication
    const clerkToken = await getUserToken();
    
    const client = createBrowserClient(
      import.meta.env.VITE_SUPABASE_URL as string,
      import.meta.env.VITE_SUPABASE_ANON_KEY as string,
      {
        global: {
          // Using fetch override to add the Clerk token to requests
          fetch: async (url: string, options: RequestInit = {}) => {
            const headers = new Headers(options?.headers);
            
            if (clerkToken) {
              // Add the Clerk JWT token to the Authorization header
              headers.set('Authorization', `Bearer ${clerkToken}`);
            }
            
            return fetch(url, { ...options, headers });
          }
        }
      }
    );
    
    return client;
  } catch (error) {
    console.error('Error creating Supabase client:', error);
    return null;
  }
}

/**
 * Function to check if the current user is the owner of an agent
 * @param agentId The ID of the agent to check
 * @returns Promise<boolean> True if the user is the owner
 */
export async function isAgentOwner(agentId: string): Promise<boolean> {
  try {
    const supabase = await createSupabaseClient();
    
    if (!supabase) {
      console.error('Supabase client not initialized');
      return false;
    }
    
    const { data, error } = await supabase
      .from('accounts')
      .select('user_id')
      .eq('id', agentId)
      .eq('is_agent', true)
      .single();
      
    if (error) {
      console.error('Error checking agent ownership:', error);
      return false;
    }
    
    // Compare with the current user ID from Clerk
    // This assumes that auth.uid() in Supabase is set to the Clerk user ID
    const { data: userData } = await supabase.auth.getUser();
    return data?.user_id === userData?.user?.id;
  } catch (error) {
    console.error('Error checking agent ownership:', error);
    return false;
  }
}
```
