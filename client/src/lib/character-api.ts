import { createSupabaseClient, isAuthenticated } from './supabase-client';
import { 
  Character, 
  CharacterFormValues, 
  CharacterSummary, 
  validateCharacter,
  characterToSupabaseFormat,
  supabaseToCharacter
} from '../types/character';

/**
 * Get all characters from the database
 * 
 * Filtering logic:
 * - Demo characters: Characters where id === email (shown in Demo Characters section)
 * - User characters: Characters where user_id matches the logged-in user's ID (shown in Your Characters section)
 * 
 * Special cases:
 * - If a character is both a demo character (id === email) and owned by the user (user_id matches),
 *   it will be shown in the "Your Characters" section
 */
export async function getCharacters(): Promise<CharacterSummary[]> {
  try {
    console.log('Fetching characters...');
    const supabase = await createSupabaseClient();
    
    // Query accounts table - RLS policies will allow viewing all characters
    const { data, error } = await supabase
      .from('accounts')
      .select('id, name, avatarUrl, createdAt, updatedAt, email, user_id, details');
    
    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }
    
    console.log(`Found ${data?.length || 0} characters in database`);
    
    if (!data || data.length === 0) {
      return [];
    }
    
    // Get the current user's ID
    const currentUserId = localStorage.getItem('userId');
    console.log(`Current user ID: ${currentUserId}`);
    
    // Map the data to the CharacterSummary type with clear flags
    return data.map(item => {
      // Demo character: id === email (built-in ElizaOS characters)
      const isBuiltIn = item.id === item.email;
      
      // User's own character: user_id matches current user ID
      const isOwnedByUser = item.user_id === currentUserId;
      
      // Hard-code avatar URLs for demo characters
      let avatarUrl = item.avatarUrl;
      const lowerName = item.name?.toLowerCase() || '';
      
      // Default bio if none exists
      let bio = item.details?.bio || [];
      
      // Check for Snoop with case-insensitive matching
      if (lowerName === 'snoop' || lowerName.includes('snoop')) {
        avatarUrl = '/snoop.jpg';
        console.log(`  - Setting hard-coded avatar for Snoop: ${avatarUrl}`);
        // Add bio if empty
        if (bio.length === 0) {
          bio = ["Rapper, entrepreneur, and cultural icon. Drop it like it's hot!"];
        }
      } 
      // Check for D3g3n_eral with case-insensitive matching and handle variations
      else if (lowerName === 'd3g3n_eral' || lowerName.includes('d3g3n') || lowerName.includes('degen')) {
        avatarUrl = '/D3g3n_eral.jpg';
        console.log(`  - Setting hard-coded avatar for D3g3n_eral: ${avatarUrl}`);
        // Add bio if empty
        if (bio.length === 0) {
          bio = ["Action hero ready to kick butt and take names. I never back down from a challenge!"];
        }
      }
      
      console.log(`Character: ${item.name} (${item.id})`);
      console.log(`  - email: ${item.email}`);
      console.log(`  - user_id: ${item.user_id}`);
      console.log(`  - currentUserId: ${currentUserId}`);
      console.log(`  - isBuiltIn: ${isBuiltIn}`);
      console.log(`  - isOwnedByUser: ${isOwnedByUser}`);
      
      // Determine which section this character should appear in
      let displaySection = "Neither";
      
      if (isOwnedByUser && !isBuiltIn) {
        // User-created characters that aren't built-in go to "Your Characters"
        displaySection = "Your Characters";
      } else if (isBuiltIn && !isOwnedByUser) {
        // Built-in characters that aren't owned by the user go to "Demo Characters"
        displaySection = "Demo Characters";
      } else if (isBuiltIn && isOwnedByUser) {
        // For characters that are both built-in and owned by the user,
        // we prioritize showing them in "Your Characters"
        displaySection = "Your Characters";
      }
      
      console.log(`  - Will appear in: ${displaySection}`);
      
      return {
        id: item.id,
        name: item.name || 'Unnamed Character',
        avatarUrl,
        created_at: item.createdAt,
        updated_at: item.updatedAt,
        isBuiltIn,
        isOwnedByUser,
        // Include bio from details if available or use our hard-coded one
        bio
      };
    });
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
    console.log(`Fetching character with ID: ${characterId}`);
    const supabase = await createSupabaseClient();
    
    // Query a single character by ID - RLS will ensure only owned records are accessible
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', characterId)
      .single();
      
    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }
    
    return supabaseToCharacter(data);
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
    console.log('Creating character:', character.name);
    const supabase = await createSupabaseClient();
    
    // Generate a new UUID for the character
    const id = crypto.randomUUID();
    console.log('Generated UUID for new character:', id);
    
    // Convert character to Supabase format
    const characterData = {
      id, // Explicitly provide the UUID
      ...characterToSupabaseFormat(character),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Standard Supabase insert pattern with explicitly provided ID
    const { data, error } = await supabase
      .from('accounts')
      .insert(characterData)
      .select('id')
      .single();
      
    if (error) {
      console.error('Error creating character:', error);
      throw error;
    }
    
    console.log('Successfully created character:', data);
    return data.id;
  } catch (error) {
    console.error('Exception creating character:', error);
    return null;
  }
}

/**
 * Update an existing character
 */
export async function updateCharacter(characterId: string, character: CharacterFormValues): Promise<boolean> {
  try {
    console.log(`Updating character ${characterId}`);
    const supabase = await createSupabaseClient();
    
    // Convert character to Supabase format
    const characterData = {
      ...characterToSupabaseFormat(character),
      updatedAt: new Date().toISOString()
    };
    
    // Standard Supabase update pattern
    const { error } = await supabase
      .from('accounts')
      .update(characterData)
      .eq('id', characterId);
      
    if (error) {
      console.error('Error updating character:', error);
      throw error;
    }
    
    console.log('Character updated successfully');
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
    console.log(`Deleting character ${characterId}`);
    const supabase = await createSupabaseClient();
    
    // Standard Supabase delete pattern
    const { error } = await supabase
      .from('accounts')
      .delete()
      .eq('id', characterId);
      
    if (error) {
      console.error('Error deleting character:', error);
      throw error;
    }
    
    console.log('Character deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting character:', error);
    return false;
  }
}

/**
 * Load a character for chat (ElizaOS integration)
 */
export async function loadCharacterForChat(characterId: string): Promise<boolean> {
  try {
    console.log(`Loading character ${characterId} for chat`);
    const character = await getCharacter(characterId);
    
    if (!character) {
      console.error('Character not found');
      return false;
    }
    
    // TODO: Implement ElizaOS integration
    // This would involve converting the character to ElizaOS format
    // and loading it into the ElizaOS runtime
    
    return true;
  } catch (error) {
    console.error('Error loading character for chat:', error);
    return false;
  }
} 