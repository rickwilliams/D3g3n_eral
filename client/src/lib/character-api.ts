import { createSupabaseClient } from './supabase-auth';
import { Character, CharacterFormValues, CharacterSummary, validateCharacter } from '../types/character';
import { SupabaseClient } from '@supabase/supabase-js';

// Define types for Supabase data
interface AccountRecord {
  id: string;
  name?: string;
  avatarUrl?: string;
  details?: any;
  user_id?: string;
  created_at: string;
  updated_at: string;
  is_agent: boolean;
}

/**
 * Get all characters for the current user
 */
export async function getCharacters(): Promise<CharacterSummary[]> {
  try {
    const supabase = await createSupabaseClient();
    if (!supabase) return [];
    
    const { data, error } = await (supabase as SupabaseClient)
      .from('accounts')
      .select('id, name, avatarUrl, details, created_at, updated_at')
      .eq('is_agent', true);
      
    if (error) throw error;
    
    // Map the data to the CharacterSummary type
    return (data as AccountRecord[]).map((item: AccountRecord) => ({
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
    
    const { data, error } = await (supabase as SupabaseClient)
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
    const { data, error } = await (supabase as SupabaseClient)
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
    const { error } = await (supabase as SupabaseClient)
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
    const { error } = await (supabase as SupabaseClient)
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
    // In a real implementation, we would call the ElizaOS API to load the character
    console.log(`Loading character ${characterId} for chat`);
    
    // This is just a placeholder - in a real implementation, we would make an API call
    // to load the character data from the database and initialize it in ElizaOS
    const character = await getCharacter(characterId);
    if (!character) return false;
    
    // For now, we'll just log that we're loading the character
    console.log(`Character ${character.name} loaded for chat`);
    
    return true;
  } catch (error) {
    console.error('Error loading character for chat:', error);
    return false;
  }
} 