/**
 * Character API functions for interacting with Supabase
 * 
 * This file contains all the functions needed to interact with the characters table in Supabase.
 * It provides a clean interface for CRUD operations and ownership verification.
 */
import { createSupabaseClient } from './supabase-auth';
import { Character, CharacterFormValues, CharacterCreationResponse, CharacterUpdateResponse } from '../types/character';
import { v4 as uuidv4 } from 'uuid';

/**
 * Get all characters for the current user
 * 
 * This function fetches all characters owned by the current authenticated user.
 * Characters are sorted by creation date in descending order (newest first).
 * 
 * @returns Promise<Character[]> Array of characters
 * 
 * TODO: Add pagination support for large collections of characters
 * TODO: Add filtering options (by name, creation date, etc.)
 * TODO: Consider adding caching to improve performance
 */
export async function getCharacters(): Promise<Character[]> {
  try {
    // Initialize Supabase client with authentication
    const supabase = await createSupabaseClient();
    if (!supabase) {
      console.error('Supabase client not initialized');
      return [];
    }
    
    // Query the characters table for all characters owned by the current user
    // The RLS policy in Supabase will automatically filter by the user's ID
    const { data, error } = await supabase
      .from('characters')
      .select('*')
      .order('created_at', { ascending: false });
      
    // Handle any errors from the query
    if (error) {
      console.error('Error fetching characters:', error);
      return [];
    }
    
    // Return the characters as an array
    return data as Character[];
  } catch (error) {
    // Catch any unexpected errors
    console.error('Error fetching characters:', error);
    return [];
  }
}

/**
 * Get a character by ID
 * 
 * This function fetches a specific character by its ID.
 * It will only return the character if the current user has access to it.
 * 
 * @param characterId The ID of the character to fetch
 * @returns Promise<Character | null> The character or null if not found
 * 
 * TODO: Add error codes for different failure scenarios
 * TODO: Consider adding a version with less fields for performance
 */
export async function getCharacter(characterId: string): Promise<Character | null> {
  try {
    // Initialize Supabase client with authentication
    const supabase = await createSupabaseClient();
    if (!supabase) {
      console.error('Supabase client not initialized');
      return null;
    }
    
    // Query the characters table for the specific character
    // The RLS policy in Supabase will ensure the user has access
    const { data, error } = await supabase
      .from('characters')
      .select('*')
      .eq('id', characterId)
      .single();
      
    // Handle any errors from the query
    if (error) {
      console.error('Error fetching character:', error);
      return null;
    }
    
    // Return the character
    return data as Character;
  } catch (error) {
    // Catch any unexpected errors
    console.error('Error fetching character:', error);
    return null;
  }
}

/**
 * Create a new character
 * 
 * This function creates a new character in the database.
 * It generates a new UUID for the character and sets the owner to the current user.
 * 
 * @param character The character data to create
 * @returns Promise<CharacterCreationResponse> The creation response
 * 
 * TODO: Add validation for character data
 * TODO: Add support for character templates
 * TODO: Consider adding optimistic updates for better UX
 */
export async function createCharacter(character: CharacterFormValues): Promise<CharacterCreationResponse> {
  try {
    // Initialize Supabase client with authentication
    const supabase = await createSupabaseClient();
    if (!supabase) {
      return { id: '', success: false, error: 'Supabase client not initialized' };
    }
    
    // Get user information to set as the owner
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      return { id: '', success: false, error: 'User not authenticated' };
    }
    
    // Generate a new ID for the character
    const characterId = uuidv4();
    
    // Process arrays from form values
    // This handles the case where bio and lore might be strings or arrays
    const processedCharacter = {
      ...character,
      bio: Array.isArray(character.bio) ? character.bio : [character.bio as unknown as string],
      lore: character.lore ? (Array.isArray(character.lore) ? character.lore : [character.lore as unknown as string]) : [],
      id: characterId,
      owner_id: userData.user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Insert the character into the database
    const { error } = await supabase
      .from('characters')
      .insert(processedCharacter);
      
    // Handle any errors from the insertion
    if (error) {
      console.error('Error creating character:', error);
      return { id: '', success: false, error: error.message };
    }
    
    // Return success with the new character ID
    return { id: characterId, success: true };
  } catch (error) {
    // Catch any unexpected errors
    console.error('Error creating character:', error);
    return { 
      id: '', 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Update an existing character
 * 
 * This function updates an existing character in the database.
 * It will only update the character if the current user has access to it.
 * 
 * @param characterId The ID of the character to update
 * @param character The updated character data
 * @returns Promise<CharacterUpdateResponse> The update response
 * 
 * TODO: Add partial updates to avoid overwriting unmodified fields
 * TODO: Add version control to prevent conflicts
 * TODO: Consider adding a history of changes
 */
export async function updateCharacter(characterId: string, character: CharacterFormValues): Promise<CharacterUpdateResponse> {
  try {
    // Initialize Supabase client with authentication
    const supabase = await createSupabaseClient();
    if (!supabase) {
      return { success: false, error: 'Supabase client not initialized' };
    }
    
    // Process arrays from form values
    // This handles the case where bio and lore might be strings or arrays
    const processedCharacter = {
      ...character,
      bio: Array.isArray(character.bio) ? character.bio : [character.bio as unknown as string],
      lore: character.lore ? (Array.isArray(character.lore) ? character.lore : [character.lore as unknown as string]) : [],
      updated_at: new Date().toISOString()
    };
    
    // Update the character in the database
    // The RLS policy in Supabase will ensure the user has access
    const { error } = await supabase
      .from('characters')
      .update(processedCharacter)
      .eq('id', characterId);
      
    // Handle any errors from the update
    if (error) {
      console.error('Error updating character:', error);
      return { success: false, error: error.message };
    }
    
    // Return success
    return { success: true };
  } catch (error) {
    // Catch any unexpected errors
    console.error('Error updating character:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Delete a character
 * 
 * This function deletes a character from the database.
 * It will only delete the character if the current user has access to it.
 * 
 * @param characterId The ID of the character to delete
 * @returns Promise<CharacterUpdateResponse> The deletion response
 * 
 * TODO: Add soft delete option to allow recovery
 * TODO: Add cleanup of related resources (e.g., avatar images)
 */
export async function deleteCharacter(characterId: string): Promise<CharacterUpdateResponse> {
  try {
    // Initialize Supabase client with authentication
    const supabase = await createSupabaseClient();
    if (!supabase) {
      return { success: false, error: 'Supabase client not initialized' };
    }
    
    // Delete the character from the database
    // The RLS policy in Supabase will ensure the user has access
    const { error } = await supabase
      .from('characters')
      .delete()
      .eq('id', characterId);
      
    // Handle any errors from the deletion
    if (error) {
      console.error('Error deleting character:', error);
      return { success: false, error: error.message };
    }
    
    // Return success
    return { success: true };
  } catch (error) {
    // Catch any unexpected errors
    console.error('Error deleting character:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Check if the current user is the owner of a character
 * 
 * This function checks if the current authenticated user is the owner of a specific character.
 * It's useful for UI decisions like showing edit/delete buttons.
 * 
 * @param characterId The ID of the character to check
 * @returns Promise<boolean> True if the user is the owner
 * 
 * TODO: Add role-based access control for team scenarios
 * TODO: Consider caching results for frequently checked characters
 */
export async function isCharacterOwner(characterId: string): Promise<boolean> {
  try {
    // Initialize Supabase client with authentication
    const supabase = await createSupabaseClient();
    
    if (!supabase) {
      console.error('Supabase client not initialized');
      return false;
    }
    
    // Query the characters table to check ownership
    const { data, error } = await supabase
      .from('characters')
      .select('owner_id')
      .eq('id', characterId)
      .single();
      
    // Handle any errors from the query
    if (error) {
      console.error('Error checking character ownership:', error);
      return false;
    }
    
    // Get the current user ID
    const { data: userData } = await supabase.auth.getUser();
    
    // Compare with the character's owner_id
    return data?.owner_id === userData?.user?.id;
  } catch (error) {
    // Catch any unexpected errors
    console.error('Error checking character ownership:', error);
    return false;
  }
} 