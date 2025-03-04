/**
 * Character API Routes
 * 
 * This module provides API endpoints for managing characters.
 * It includes routes for retrieving, creating, updating, and deleting characters.
 */

import express from 'express';
import { characterLoader } from '@elizaos/core/characterLoader';
import { logger } from '@elizaos/core/logger';

const router = express.Router();

/**
 * Get all characters for the authenticated user
 * 
 * @route GET /api/characters
 * @returns {Array} 200 - An array of characters
 * @returns {Error} 401 - Unauthorized
 * @returns {Error} 500 - Server error
 */
router.get('/', async (req, res) => {
  try {
    // Get user ID from auth token or session
    const userId = req.headers['x-user-id'] as string;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const characters = await characterLoader.getCharactersForUser(userId);
    
    return res.status(200).json({ characters });
  } catch (error) {
    logger.error(`Error getting characters: ${error instanceof Error ? error.message : String(error)}`);
    return res.status(500).json({ error: 'Failed to retrieve characters' });
  }
});

/**
 * Get a character by ID
 * 
 * @route GET /api/characters/:id
 * @param {string} id.path.required - Character ID
 * @returns {Object} 200 - Character object
 * @returns {Error} 401 - Unauthorized
 * @returns {Error} 404 - Character not found
 * @returns {Error} 500 - Server error
 */
router.get('/:id', async (req, res) => {
  try {
    const characterId = req.params.id;
    // Get user ID from auth token or session
    const userId = req.headers['x-user-id'] as string;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const character = await characterLoader.getCharacter(characterId, userId);
    
    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }
    
    return res.status(200).json({ character });
  } catch (error) {
    logger.error(`Error getting character: ${error instanceof Error ? error.message : String(error)}`);
    return res.status(500).json({ error: 'Failed to retrieve character' });
  }
});

/**
 * Create a new character
 * 
 * @route POST /api/characters
 * @param {Object} request.body.required - Character data
 * @returns {Object} 201 - Created character
 * @returns {Error} 401 - Unauthorized
 * @returns {Error} 400 - Invalid request
 * @returns {Error} 500 - Server error
 */
router.post('/', async (req, res) => {
  try {
    // Get user ID from auth token or session
    const userId = req.headers['x-user-id'] as string;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const characterData = req.body;
    
    if (!characterData || !characterData.name) {
      return res.status(400).json({ error: 'Invalid character data' });
    }
    
    const character = await characterLoader.createCharacter(characterData, userId);
    
    if (!character) {
      return res.status(500).json({ error: 'Failed to create character' });
    }
    
    return res.status(201).json({ character });
  } catch (error) {
    logger.error(`Error creating character: ${error instanceof Error ? error.message : String(error)}`);
    return res.status(500).json({ error: 'Failed to create character' });
  }
});

/**
 * Update a character
 * 
 * @route PUT /api/characters/:id
 * @param {string} id.path.required - Character ID
 * @param {Object} request.body.required - Updated character data
 * @returns {Object} 200 - Success message
 * @returns {Error} 401 - Unauthorized
 * @returns {Error} 403 - Forbidden
 * @returns {Error} 404 - Character not found
 * @returns {Error} 500 - Server error
 */
router.put('/:id', async (req, res) => {
  try {
    const characterId = req.params.id;
    // Get user ID from auth token or session
    const userId = req.headers['x-user-id'] as string;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Check if character exists and user owns it
    const isOwner = await characterLoader.isCharacterOwner(characterId, userId);
    
    if (!isOwner) {
      return res.status(403).json({ error: 'You do not have permission to update this character' });
    }
    
    const characterData = req.body;
    
    const success = await characterLoader.updateCharacter(characterId, characterData, userId);
    
    if (!success) {
      return res.status(500).json({ error: 'Failed to update character' });
    }
    
    return res.status(200).json({ message: 'Character updated successfully' });
  } catch (error) {
    logger.error(`Error updating character: ${error instanceof Error ? error.message : String(error)}`);
    return res.status(500).json({ error: 'Failed to update character' });
  }
});

/**
 * Delete a character
 * 
 * @route DELETE /api/characters/:id
 * @param {string} id.path.required - Character ID
 * @returns {Object} 200 - Success message
 * @returns {Error} 401 - Unauthorized
 * @returns {Error} 403 - Forbidden
 * @returns {Error} 404 - Character not found
 * @returns {Error} 500 - Server error
 */
router.delete('/:id', async (req, res) => {
  try {
    const characterId = req.params.id;
    // Get user ID from auth token or session
    const userId = req.headers['x-user-id'] as string;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Check if character exists and user owns it
    const isOwner = await characterLoader.isCharacterOwner(characterId, userId);
    
    if (!isOwner) {
      return res.status(403).json({ error: 'You do not have permission to delete this character' });
    }
    
    const success = await characterLoader.deleteCharacter(characterId, userId);
    
    if (!success) {
      return res.status(500).json({ error: 'Failed to delete character' });
    }
    
    return res.status(200).json({ message: 'Character deleted successfully' });
  } catch (error) {
    logger.error(`Error deleting character: ${error instanceof Error ? error.message : String(error)}`);
    return res.status(500).json({ error: 'Failed to delete character' });
  }
});

export default router; 