/**
 * Character Form Hook
 * 
 * This file contains a custom React hook for managing character form state.
 * It integrates with react-hook-form and zod for form validation.
 */
import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Character, CharacterFormValues } from '@/types/character';

/**
 * Character form schema for validation
 * 
 * This schema defines the validation rules for character form fields.
 * It uses zod for type-safe validation.
 * 
 * TODO: Add more specific validation rules for each field
 * TODO: Consider adding custom error messages for better UX
 */
export const characterFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  bio: z.union([z.string(), z.array(z.string())]),
  style: z.string().min(1, 'Style is required'),
  topics: z.array(z.string()),
  adjectives: z.array(z.string()),
  lore: z.union([z.string(), z.array(z.string())]).optional(),
  avatarUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  clients: z.array(z.string()).optional(),
  plugins: z.array(z.string()).optional(),
  knowledge: z.array(z.string()).optional(),
  templates: z.record(z.string()).optional(),
});

/**
 * Default values for a new character form
 * 
 * These values are used as defaults when creating a new character.
 * They provide a starting point for the form.
 */
export const defaultCharacterFormValues: CharacterFormValues = {
  name: '',
  bio: '',
  style: '',
  topics: [],
  adjectives: [],
  lore: '',
  avatarUrl: '',
  clients: [],
  plugins: [],
  knowledge: [],
  templates: {},
};

/**
 * Hook for managing character form state
 * 
 * This hook provides form state management for character creation and editing.
 * It handles form validation, default values, and form submission.
 * 
 * @param initialValues Optional initial values for the form
 * @returns Object containing form state and helper functions
 * 
 * TODO: Add form field error handling
 * TODO: Add form submission tracking
 * TODO: Consider adding form dirty state tracking
 */
export function useCharacterForm(initialValues?: Partial<CharacterFormValues>) {
  // State for saving status and errors
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  
  // Initialize form with default values or provided initial values
  // Note: We're not specifying a type argument for useForm as it's inferred from the resolver
  const form = useForm({
    resolver: zodResolver(characterFormSchema),
    defaultValues: initialValues ? { ...defaultCharacterFormValues, ...initialValues } : defaultCharacterFormValues,
  });

  /**
   * Reset the form to initial values
   * 
   * This function resets the form to either the provided values or the default values.
   * It also clears any save errors.
   * 
   * @param values Optional values to reset the form to
   */
  const resetForm = useCallback((values?: Partial<CharacterFormValues>) => {
    form.reset(values ? { ...defaultCharacterFormValues, ...values } : defaultCharacterFormValues);
    setSaveError(null);
  }, [form]);

  /**
   * Convert a Character object to CharacterFormValues
   * 
   * This function converts a Character object from the API to a format suitable for the form.
   * It handles the differences between the two interfaces.
   * 
   * @param character The Character object to convert
   * @returns The converted CharacterFormValues
   */
  const characterToFormValues = useCallback((character: Character): CharacterFormValues => {
    return {
      name: character.name,
      bio: character.bio,
      style: character.style,
      topics: character.topics,
      adjectives: character.adjectives,
      lore: character.lore || '',
      avatarUrl: character.avatarUrl || '',
      clients: character.clients || [],
      plugins: character.plugins || [],
      knowledge: character.knowledge || [],
      templates: character.templates || {},
    };
  }, []);

  /**
   * Load a character into the form
   * 
   * This function takes a Character object and loads it into the form.
   * It converts the Character to CharacterFormValues and resets the form.
   * 
   * @param character The Character object to load
   */
  const loadCharacter = useCallback((character: Character) => {
    const formValues = characterToFormValues(character);
    resetForm(formValues);
  }, [characterToFormValues, resetForm]);

  // Return all the form state and functions
  return {
    form,
    isSaving,
    setIsSaving,
    saveError,
    setSaveError,
    resetForm,
    loadCharacter,
    characterToFormValues,
  };
} 