/**
 * Character type definitions
 * 
 * This file contains all the type definitions related to characters in the ElizaOS platform.
 * These types are used throughout the application for type safety and consistency.
 */

/**
 * Character interface representing a character in the database
 * 
 * This is the main data structure for a character as stored in Supabase.
 * It includes all the fields needed to define a character's personality, appearance, and behavior.
 * 
 * TODO: Consider splitting into smaller interfaces for better maintainability
 * TODO: Add versioning support for character evolution
 * TODO: Add support for character categories or tags
 */
export interface Character {
  // Core identification
  id: string;                     // Unique identifier for the character
  name: string;                   // Display name of the character
  bio: string[];                  // Character biography as an array of paragraphs
  style: string;                  // Character's communication style
  topics: string[];               // Topics the character is knowledgeable about
  adjectives: string[];           // Adjectives that describe the character's personality
  owner_id: string;               // ID of the user who owns this character
  created_at: string;             // ISO timestamp of when the character was created
  updated_at: string;             // ISO timestamp of when the character was last updated
  
  // Optional fields
  lore?: string[];                // Additional background lore as an array of paragraphs
  avatarUrl?: string;             // URL to the character's avatar image
  clients?: string[];             // Client platforms where this character is available
  plugins?: string[];             // Plugins that enhance this character's capabilities
  knowledge?: string[];           // Additional knowledge sources for the character
  templates?: Record<string, string>; // Templates for different types of responses
}

/**
 * Character form values for creating or updating a character
 * 
 * This interface is used for form handling when creating or editing a character.
 * It's similar to the Character interface but with some differences to accommodate form state.
 * 
 * TODO: Add validation rules directly in the interface
 * TODO: Consider using a class with methods for validation
 */
export interface CharacterFormValues {
  name: string;                   // Display name of the character
  bio: string | string[];         // Character biography (can be a string or array of strings)
  style: string;                  // Character's communication style
  topics: string[];               // Topics the character is knowledgeable about
  adjectives: string[];           // Adjectives that describe the character's personality
  
  // Optional fields
  lore?: string | string[];       // Additional background lore (can be a string or array of strings)
  avatarUrl?: string;             // URL to the character's avatar image
  clients?: string[];             // Client platforms where this character is available
  plugins?: string[];             // Plugins that enhance this character's capabilities
  knowledge?: string[];           // Additional knowledge sources for the character
  templates?: Record<string, string>; // Templates for different types of responses
}

/**
 * Response interface for character creation
 * 
 * This interface defines the structure of the response when creating a new character.
 * It includes the ID of the created character and a success flag.
 * 
 * TODO: Add more detailed error information
 * TODO: Consider adding validation errors field
 */
export interface CharacterCreationResponse {
  id: string;                     // ID of the created character (empty if creation failed)
  success: boolean;               // Whether the creation was successful
  error?: string;                 // Error message if creation failed
}

/**
 * Response interface for character update or deletion
 * 
 * This interface defines the structure of the response when updating or deleting a character.
 * It includes a success flag and an optional error message.
 * 
 * TODO: Add more detailed error information
 * TODO: Consider adding a data field for the updated character
 */
export interface CharacterUpdateResponse {
  success: boolean;               // Whether the operation was successful
  error?: string;                 // Error message if the operation failed
} 