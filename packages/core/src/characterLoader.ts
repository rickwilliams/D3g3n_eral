/**
 * CharacterLoader Service
 * 
 * This service is responsible for loading, caching, and managing character data
 * from Supabase. It provides methods for retrieving, creating, updating, and
 * deleting characters, as well as caching mechanisms for better performance.
 */

import { Character, UUID, MessageExample, ModelProviderName } from './types';
import { createSupabaseClient } from './supabase';
import { logger } from './logger';

/**
 * Extended Character type with additional fields needed for database operations
 */
interface ExtendedCharacter extends Character {
  owner_id?: string;
  avatarUrl?: string;
  clients?: string[];
}

/**
 * Character cache entry with timestamp for expiration
 */
interface CharacterCacheEntry {
  character: ExtendedCharacter;
  timestamp: number;
  userId: string;
}

/**
 * Configuration options for the CharacterLoader
 */
export interface CharacterLoaderOptions {
  /** Cache expiration time in milliseconds (default: 5 minutes) */
  cacheExpirationMs?: number;
  /** Maximum number of characters to cache (default: 100) */
  maxCacheSize?: number;
  /** Supabase URL (optional, will use environment variable if not provided) */
  supabaseUrl?: string;
  /** Supabase anon key (optional, will use environment variable if not provided) */
  supabaseAnonKey?: string;
}

/**
 * CharacterLoader class for managing character data
 */
export class CharacterLoader {
  private cache: Map<string, CharacterCacheEntry> = new Map();
  private cacheExpirationMs: number;
  private maxCacheSize: number;
  private supabaseUrl: string;
  private supabaseAnonKey: string;

  /**
   * Create a new CharacterLoader instance
   * @param options Configuration options
   */
  constructor(options: CharacterLoaderOptions = {}) {
    this.cacheExpirationMs = options.cacheExpirationMs || 5 * 60 * 1000; // 5 minutes default
    this.maxCacheSize = options.maxCacheSize || 100;
    this.supabaseUrl = options.supabaseUrl || process.env.SUPABASE_URL || '';
    this.supabaseAnonKey = options.supabaseAnonKey || process.env.SUPABASE_ANON_KEY || '';
    
    if (!this.supabaseUrl || !this.supabaseAnonKey) {
      logger.warn('CharacterLoader: Missing Supabase credentials. Some functionality may be limited.');
    }
  }

  /**
   * Get a character by ID
   * @param characterId The character ID
   * @param userId The user ID requesting the character (for authorization)
   * @param skipCache Whether to skip the cache and force a fresh load
   * @returns The character or null if not found
   */
  async getCharacter(characterId: UUID, userId: string, skipCache = false): Promise<ExtendedCharacter | null> {
    // Check cache first if not skipping
    if (!skipCache) {
      const cachedCharacter = this.getCachedCharacter(characterId);
      if (cachedCharacter && (cachedCharacter.userId === userId || await this.isCharacterPublic(characterId))) {
        return cachedCharacter.character;
      }
    }

    try {
      const supabase = await createSupabaseClient(userId);
      
      // Query the characters table
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('id', characterId)
        .single();
      
      if (error) {
        logger.error(`Error fetching character ${characterId}: ${error.message}`);
        return null;
      }
      
      if (!data) {
        return null;
      }
      
      // Convert to Character type
      const character = this.mapDatabaseToCharacter(data);
      
      // Cache the result
      this.cacheCharacter(characterId, character, userId);
      
      return character;
    } catch (error) {
      logger.error(`Error in getCharacter: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  /**
   * Get all characters for a user
   * @param userId The user ID
   * @returns Array of characters
   */
  async getCharactersForUser(userId: string): Promise<ExtendedCharacter[]> {
    try {
      const supabase = await createSupabaseClient(userId);
      
      // Query the characters table
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('owner_id', userId);
      
      if (error) {
        logger.error(`Error fetching characters for user ${userId}: ${error.message}`);
        return [];
      }
      
      if (!data || data.length === 0) {
        return [];
      }
      
      // Convert to Character type and cache
      const characters = data.map(item => {
        const character = this.mapDatabaseToCharacter(item);
        this.cacheCharacter(item.id, character, userId);
        return character;
      });
      
      return characters;
    } catch (error) {
      logger.error(`Error in getCharactersForUser: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  /**
   * Create a new character
   * @param character The character to create
   * @param userId The user ID creating the character
   * @returns The created character with ID or null if creation failed
   */
  async createCharacter(character: Omit<ExtendedCharacter, 'id'>, userId: string): Promise<ExtendedCharacter | null> {
    try {
      const supabase = await createSupabaseClient(userId);
      
      // Prepare the character for database insertion
      const dbCharacter = this.mapCharacterToDatabase({
        ...character,
        id: crypto.randomUUID() as UUID,
        messageExamples: character.messageExamples || [],
        postExamples: character.postExamples || []
      } as ExtendedCharacter);
      
      // Add owner_id
      dbCharacter.owner_id = userId;
      
      // Insert into the characters table
      const { data, error } = await supabase
        .from('characters')
        .insert(dbCharacter)
        .select()
        .single();
      
      if (error) {
        logger.error(`Error creating character: ${error.message}`);
        return null;
      }
      
      if (!data) {
        return null;
      }
      
      // Convert to Character type
      const createdCharacter = this.mapDatabaseToCharacter(data);
      
      // Cache the result
      this.cacheCharacter(createdCharacter.id, createdCharacter, userId);
      
      return createdCharacter;
    } catch (error) {
      logger.error(`Error in createCharacter: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  /**
   * Update an existing character
   * @param characterId The character ID to update
   * @param character The updated character data
   * @param userId The user ID updating the character
   * @returns True if update was successful
   */
  async updateCharacter(characterId: UUID, character: Partial<ExtendedCharacter>, userId: string): Promise<boolean> {
    try {
      // Check if user owns the character
      const isOwner = await this.isCharacterOwner(characterId, userId);
      if (!isOwner) {
        logger.warn(`User ${userId} attempted to update character ${characterId} but is not the owner`);
        return false;
      }
      
      const supabase = await createSupabaseClient(userId);
      
      // Prepare the character for database update
      const dbCharacter = this.mapCharacterToDatabase(character as ExtendedCharacter);
      
      // Update the characters table
      const { error } = await supabase
        .from('characters')
        .update(dbCharacter)
        .eq('id', characterId);
      
      if (error) {
        logger.error(`Error updating character ${characterId}: ${error.message}`);
        return false;
      }
      
      // Invalidate cache
      this.cache.delete(characterId);
      
      return true;
    } catch (error) {
      logger.error(`Error in updateCharacter: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * Delete a character
   * @param characterId The character ID to delete
   * @param userId The user ID deleting the character
   * @returns True if deletion was successful
   */
  async deleteCharacter(characterId: UUID, userId: string): Promise<boolean> {
    try {
      // Check if user owns the character
      const isOwner = await this.isCharacterOwner(characterId, userId);
      if (!isOwner) {
        logger.warn(`User ${userId} attempted to delete character ${characterId} but is not the owner`);
        return false;
      }
      
      const supabase = await createSupabaseClient(userId);
      
      // Delete from the characters table
      const { error } = await supabase
        .from('characters')
        .delete()
        .eq('id', characterId);
      
      if (error) {
        logger.error(`Error deleting character ${characterId}: ${error.message}`);
        return false;
      }
      
      // Remove from cache
      this.cache.delete(characterId);
      
      return true;
    } catch (error) {
      logger.error(`Error in deleteCharacter: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * Check if a user is the owner of a character
   * @param characterId The character ID
   * @param userId The user ID to check
   * @returns True if the user is the owner
   */
  async isCharacterOwner(characterId: UUID, userId: string): Promise<boolean> {
    try {
      const supabase = await createSupabaseClient(userId);
      
      // Query the characters table
      const { data, error } = await supabase
        .from('characters')
        .select('owner_id')
        .eq('id', characterId)
        .single();
      
      if (error || !data) {
        return false;
      }
      
      return data.owner_id === userId;
    } catch (error) {
      logger.error(`Error in isCharacterOwner: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * Check if a character is public (can be viewed by anyone)
   * @param characterId The character ID
   * @returns True if the character is public
   */
  async isCharacterPublic(characterId: UUID): Promise<boolean> {
    try {
      // For now, we'll assume characters are not public by default
      // This can be expanded later to check a 'is_public' field in the database
      return false;
    } catch (error) {
      logger.error(`Error in isCharacterPublic: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  /**
   * Clear the entire character cache
   */
  clearCache(): void {
    this.cache.clear();
    logger.debug('Character cache cleared');
  }

  /**
   * Get a character from the cache
   * @param characterId The character ID
   * @returns The cached character entry or null if not found or expired
   */
  private getCachedCharacter(characterId: string): CharacterCacheEntry | null {
    const cachedEntry = this.cache.get(characterId);
    
    if (!cachedEntry) {
      return null;
    }
    
    // Check if cache entry has expired
    const now = Date.now();
    if (now - cachedEntry.timestamp > this.cacheExpirationMs) {
      this.cache.delete(characterId);
      return null;
    }
    
    return cachedEntry;
  }

  /**
   * Cache a character
   * @param characterId The character ID
   * @param character The character to cache
   * @param userId The user ID associated with the character
   */
  private cacheCharacter(characterId: string, character: ExtendedCharacter, userId: string): void {
    // Enforce cache size limit with LRU eviction
    if (this.cache.size >= this.maxCacheSize) {
      // Find the oldest entry
      let oldestKey: string | null = null;
      let oldestTimestamp = Infinity;
      
      for (const [key, entry] of this.cache.entries()) {
        if (entry.timestamp < oldestTimestamp) {
          oldestTimestamp = entry.timestamp;
          oldestKey = key;
        }
      }
      
      // Remove the oldest entry
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
    
    // Add to cache
    this.cache.set(characterId, {
      character,
      timestamp: Date.now(),
      userId
    });
  }

  /**
   * Map a database record to a Character object
   * @param data The database record
   * @returns The Character object
   */
  private mapDatabaseToCharacter(data: any): ExtendedCharacter {
    // Handle arrays stored as JSON strings
    const parseArrayField = (field: any): string[] => {
      if (Array.isArray(field)) {
        return field;
      }
      if (typeof field === 'string') {
        try {
          const parsed = JSON.parse(field);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [field];
        }
      }
      return [];
    };
    
    // Handle objects stored as JSON strings
    const parseObjectField = (field: any): Record<string, any> => {
      if (typeof field === 'object' && field !== null && !Array.isArray(field)) {
        return field;
      }
      if (typeof field === 'string') {
        try {
          const parsed = JSON.parse(field);
          return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) ? parsed : {};
        } catch {
          return {};
        }
      }
      return {};
    };
    
    // Parse message examples
    const parseMessageExamples = (field: any): MessageExample[][] => {
      try {
        if (Array.isArray(field)) {
          return field;
        }
        if (typeof field === 'string') {
          const parsed = JSON.parse(field);
          return Array.isArray(parsed) ? parsed : [];
        }
        return [];
      } catch {
        return [];
      }
    };
    
    // Create the Character object with proper type conversions
    return {
      id: data.id as UUID,
      name: data.name || '',
      bio: parseArrayField(data.bio),
      lore: parseArrayField(data.lore),
      style: {
        all: parseArrayField(data.style?.all || data.style_all || []),
        chat: parseArrayField(data.style?.chat || data.style_chat || []),
        post: parseArrayField(data.style?.post || data.style_post || [])
      },
      topics: parseArrayField(data.topics),
      adjectives: parseArrayField(data.adjectives),
      clients: parseArrayField(data.clients),
      plugins: parseArrayField(data.plugins),
      knowledge: parseArrayField(data.knowledge),
      templates: parseObjectField(data.templates),
      modelProvider: (data.model_provider || 'openai') as ModelProviderName,
      avatarUrl: data.avatar_url,
      username: data.username || '',
      email: data.email || '',
      settings: parseObjectField(data.settings),
      owner_id: data.owner_id,
      messageExamples: parseMessageExamples(data.message_examples || []),
      postExamples: parseArrayField(data.post_examples || []),
      system: data.system || ''
    } as ExtendedCharacter;
  }

  /**
   * Map a Character object to a database record
   * @param character The Character object
   * @returns The database record
   */
  private mapCharacterToDatabase(character: ExtendedCharacter): any {
    return {
      id: character.id,
      name: character.name,
      bio: Array.isArray(character.bio) ? character.bio : [character.bio],
      lore: character.lore,
      style_all: character.style?.all,
      style_chat: character.style?.chat,
      style_post: character.style?.post,
      topics: character.topics,
      adjectives: character.adjectives,
      clients: character.clients,
      plugins: character.plugins,
      knowledge: character.knowledge,
      templates: typeof character.templates === 'object' ? character.templates : {},
      model_provider: character.modelProvider,
      avatar_url: character.avatarUrl,
      username: character.username,
      email: character.email,
      settings: character.settings,
      owner_id: character.owner_id,
      message_examples: character.messageExamples,
      post_examples: character.postExamples,
      system: character.system
    };
  }
}

// Export a singleton instance
export const characterLoader = new CharacterLoader(); 