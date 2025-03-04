/**
 * Character Templates Hook
 * 
 * This file contains a custom React hook for managing character templates.
 * Templates are predefined text snippets that can be used for character responses.
 */
import { useState, useCallback } from 'react';
import { CharacterFormValues } from '@/types/character';

/**
 * Template interface
 * 
 * This interface defines the structure of a template.
 * Templates have an ID, name, and content.
 */
export interface Template {
  id: string;                 // Unique identifier for the template
  name: string;               // Display name of the template
  content: string;            // The template content
}

/**
 * Hook for managing character templates
 * 
 * This hook provides state and functions for managing character templates.
 * It integrates with the character form to store templates in the form state.
 * 
 * @param form The form instance from useCharacterForm
 * @returns Object containing template state and functions
 * 
 * TODO: Add template categories
 * TODO: Add template versioning
 * TODO: Consider adding template validation
 */
export function useCharacterTemplates(form: any) {
  // State for active template and editing mode
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  /**
   * Get all templates from the form
   * 
   * This function retrieves all templates from the form state and converts them to Template objects.
   * 
   * @returns Array of Template objects
   */
  const getTemplates = useCallback((): Template[] => {
    // Get templates from form state or use empty object if not defined
    const templates = form.getValues('templates') || {};
    
    // Convert the templates object to an array of Template objects
    return Object.entries(templates).map(([id, content]) => ({
      id,
      name: id.split('/').pop() || id,
      content: content as string,
    }));
  }, [form]);

  /**
   * Add a new template
   * 
   * This function adds a new template to the form state.
   * It generates a unique ID for the template based on the current time and name.
   * 
   * @param name The name of the template
   * @param content The content of the template (defaults to empty string)
   * @returns The ID of the new template
   */
  const addTemplate = useCallback((name: string, content: string = '') => {
    // Get current templates from form state
    const templates = form.getValues('templates') || {};
    
    // Generate a unique ID for the template
    const id = `template/${Date.now()}/${name.toLowerCase().replace(/\s+/g, '-')}`;
    
    // Add the new template to the form state
    form.setValue('templates', {
      ...templates,
      [id]: content,
    }, { shouldDirty: true });
    
    // Set the new template as active
    setActiveTemplate(id);
    return id;
  }, [form]);

  /**
   * Update an existing template
   * 
   * This function updates the content of an existing template.
   * 
   * @param id The ID of the template to update
   * @param content The new content for the template
   * @returns True if the template was updated, false if not found
   */
  const updateTemplate = useCallback((id: string, content: string) => {
    // Get current templates from form state
    const templates = form.getValues('templates') || {};
    
    // Check if the template exists
    if (templates[id] !== undefined) {
      // Update the template in the form state
      form.setValue('templates', {
        ...templates,
        [id]: content,
      }, { shouldDirty: true });
      return true;
    }
    
    return false;
  }, [form]);

  /**
   * Delete a template
   * 
   * This function deletes a template from the form state.
   * If the deleted template is the active template, it clears the active template.
   * 
   * @param id The ID of the template to delete
   * @returns True if the template was deleted, false if not found
   */
  const deleteTemplate = useCallback((id: string) => {
    // Get current templates from form state
    const templates = form.getValues('templates') || {};
    
    // Check if the template exists
    if (templates[id] !== undefined) {
      // Create a new templates object without the deleted template
      const newTemplates = { ...templates };
      delete newTemplates[id];
      
      // Update the form state
      form.setValue('templates', newTemplates, { shouldDirty: true });
      
      // Clear active template if it was the deleted template
      if (activeTemplate === id) {
        setActiveTemplate(null);
      }
      
      return true;
    }
    
    return false;
  }, [form, activeTemplate]);

  /**
   * Get a template by ID
   * 
   * This function retrieves a specific template by its ID.
   * 
   * @param id The ID of the template to retrieve
   * @returns The Template object or null if not found
   */
  const getTemplate = useCallback((id: string): Template | null => {
    // Get current templates from form state
    const templates = form.getValues('templates') || {};
    const content = templates[id];
    
    // Check if the template exists
    if (content !== undefined) {
      return {
        id,
        name: id.split('/').pop() || id,
        content: content as string,
      };
    }
    
    return null;
  }, [form]);

  /**
   * Rename a template
   * 
   * This function renames a template by creating a new template with the new name
   * and deleting the old one. It preserves the content.
   * 
   * @param id The ID of the template to rename
   * @param newName The new name for the template
   * @returns The ID of the renamed template or null if not found
   */
  const renameTemplate = useCallback((id: string, newName: string) => {
    // Get current templates from form state
    const templates = form.getValues('templates') || {};
    const content = templates[id];
    
    // Check if the template exists
    if (content !== undefined) {
      // Generate a new ID with the new name
      const newId = `template/${Date.now()}/${newName.toLowerCase().replace(/\s+/g, '-')}`;
      const newTemplates = { ...templates };
      
      // Remove the old template and add the new one
      delete newTemplates[id];
      newTemplates[newId] = content;
      
      // Update the form state
      form.setValue('templates', newTemplates, { shouldDirty: true });
      
      // Update active template if it was the renamed template
      if (activeTemplate === id) {
        setActiveTemplate(newId);
      }
      
      return newId;
    }
    
    return null;
  }, [form, activeTemplate]);

  // Return all the state and functions
  return {
    activeTemplate,
    setActiveTemplate,
    isEditing,
    setIsEditing,
    getTemplates,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    getTemplate,
    renameTemplate,
  };
} 