/**
 * Character Hooks
 * 
 * This file contains custom React hooks for managing character data.
 * It provides hooks for both single character management and multiple characters.
 */
import { useState, useCallback, useEffect } from 'react';
import { 
  getCharacter, 
  getCharacters, 
  createCharacter, 
  updateCharacter, 
  deleteCharacter, 
  isCharacterOwner 
} from '@/lib/character-api';
import { Character, CharacterFormValues, CharacterCreationResponse, CharacterUpdateResponse } from '@/types/character';

/**
 * Hook for managing a single character
 * 
 * This hook provides state and functions for fetching, updating, and deleting a single character.
 * It also tracks loading states and errors for better UX.
 * 
 * @param characterId Optional character ID to fetch on mount
 * @returns Object containing character data, loading states, and functions
 * 
 * TODO: Add support for optimistic updates
 * TODO: Add caching for better performance
 * TODO: Consider adding a refetch interval for real-time updates
 */
export function useCharacter(characterId?: string) {
  // State for character data and loading states
  const [character, setCharacter] = useState<Character | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  /**
   * Fetch a character by ID
   * 
   * This function fetches a character from the API and updates the local state.
   * It also checks if the current user is the owner of the character.
   * 
   * @param id The ID of the character to fetch
   * @returns The fetched character or null if not found
   */
  const fetchCharacter = useCallback(async (id: string) => {
    // Set loading state and clear any previous errors
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch the character from the API
      const data = await getCharacter(id);
      setCharacter(data);
      
      // Check if the current user is the owner
      if (data) {
        const ownerStatus = await isCharacterOwner(id);
        setIsOwner(ownerStatus);
      }
      
      return data;
    } catch (err) {
      // Handle any errors
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch character';
      setError(errorMessage);
      return null;
    } finally {
      // Reset loading state regardless of success or failure
      setIsLoading(false);
    }
  }, []);

  /**
   * Update a character
   * 
   * This function updates a character in the API and refreshes the local state.
   * 
   * @param id The ID of the character to update
   * @param data The updated character data
   * @returns The update response
   */
  const updateCharacterData = useCallback(async (id: string, data: CharacterFormValues): Promise<CharacterUpdateResponse> => {
    // Set updating state and clear any previous errors
    setIsUpdating(true);
    setError(null);
    
    try {
      // Update the character in the API
      const result = await updateCharacter(id, data);
      
      if (result.success) {
        // Refresh the character data if update was successful
        await fetchCharacter(id);
      } else if (result.error) {
        // Set error state if update failed
        setError(result.error);
      }
      
      return result;
    } catch (err) {
      // Handle any errors
      const errorMessage = err instanceof Error ? err.message : 'Failed to update character';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      // Reset updating state regardless of success or failure
      setIsUpdating(false);
    }
  }, [fetchCharacter]);

  /**
   * Delete a character
   * 
   * This function deletes a character from the API and clears the local state.
   * 
   * @param id The ID of the character to delete
   * @returns The deletion response
   */
  const deleteCharacterData = useCallback(async (id: string): Promise<CharacterUpdateResponse> => {
    // Set deleting state and clear any previous errors
    setIsDeleting(true);
    setError(null);
    
    try {
      // Delete the character from the API
      const result = await deleteCharacter(id);
      
      if (result.success) {
        // Clear the character data if deletion was successful
        setCharacter(null);
      } else if (result.error) {
        // Set error state if deletion failed
        setError(result.error);
      }
      
      return result;
    } catch (err) {
      // Handle any errors
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete character';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      // Reset deleting state regardless of success or failure
      setIsDeleting(false);
    }
  }, []);

  // Fetch character on mount if ID is provided
  useEffect(() => {
    if (characterId) {
      fetchCharacter(characterId);
    }
  }, [characterId, fetchCharacter]);

  // Return all the state and functions
  return {
    character,
    isLoading,
    isUpdating,
    isDeleting,
    isOwner,
    error,
    fetchCharacter,
    updateCharacter: updateCharacterData,
    deleteCharacter: deleteCharacterData,
  };
}

/**
 * Hook for managing multiple characters
 * 
 * This hook provides state and functions for fetching all characters and creating new ones.
 * It's useful for character listing pages and dashboards.
 * 
 * @returns Object containing characters array, loading states, and functions
 * 
 * TODO: Add pagination support
 * TODO: Add filtering and sorting options
 * TODO: Add search functionality
 */
export function useCharacters() {
  // State for characters data and loading states
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch all characters
   * 
   * This function fetches all characters from the API and updates the local state.
   * 
   * @returns The fetched characters array
   */
  const fetchCharacters = useCallback(async () => {
    // Set loading state and clear any previous errors
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch characters from the API
      const data = await getCharacters();
      setCharacters(data);
      return data;
    } catch (err) {
      // Handle any errors
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch characters';
      setError(errorMessage);
      return [];
    } finally {
      // Reset loading state regardless of success or failure
      setIsLoading(false);
    }
  }, []);

  /**
   * Create a new character
   * 
   * This function creates a new character in the API and refreshes the characters list.
   * 
   * @param data The character data to create
   * @returns The creation response
   */
  const createNewCharacter = useCallback(async (data: CharacterFormValues): Promise<CharacterCreationResponse> => {
    // Set creating state and clear any previous errors
    setIsCreating(true);
    setError(null);
    
    try {
      // Create the character in the API
      const result = await createCharacter(data);
      
      if (result.success) {
        // Refresh the characters list if creation was successful
        await fetchCharacters();
      } else if (result.error) {
        // Set error state if creation failed
        setError(result.error);
      }
      
      return result;
    } catch (err) {
      // Handle any errors
      const errorMessage = err instanceof Error ? err.message : 'Failed to create character';
      setError(errorMessage);
      return { id: '', success: false, error: errorMessage };
    } finally {
      // Reset creating state regardless of success or failure
      setIsCreating(false);
    }
  }, [fetchCharacters]);

  // Fetch characters on mount
  useEffect(() => {
    fetchCharacters();
  }, [fetchCharacters]);

  // Return all the state and functions
  return {
    characters,
    isLoading,
    isCreating,
    error,
    fetchCharacters,
    createCharacter: createNewCharacter,
  };
} 