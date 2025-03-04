/**
 * Supabase Client Utility
 * 
 * This module provides utilities for creating and managing Supabase clients
 * for both server-side and client-side operations.
 */

import { createClient } from '@supabase/supabase-js';
import { logger } from './logger';

/**
 * Create a Supabase client for a specific user
 * @param userId The user ID to create a client for
 * @returns A Supabase client instance
 */
export async function createSupabaseClient(userId: string) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.');
  }
  
  // Create a Supabase client with the user's JWT if available
  // For now, we're using the anon key for all operations
  // In a production environment, you would use the user's JWT for RLS
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      headers: {
        // You can add custom headers here if needed
      }
    }
  });
}

/**
 * Create a Supabase admin client for server-side operations
 * @returns A Supabase admin client instance
 */
export function createSupabaseAdmin() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase admin credentials. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables.');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
} 