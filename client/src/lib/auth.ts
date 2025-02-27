/**
 * Authentication utilities for integrating Clerk with Supabase
 */
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@clerk/clerk-react';
/**
 * Configuration options for Clerk authentication
 */
export const clerkConfig = {
  // TODO: Add configuration specific to your application needs
};

/**
 * Get Clerk publishable key from environment
 */
export function getClerkPublishableKey(): string {
  const key = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string;
  if (!key) {
    console.error("Missing Clerk publishable key");
  }
  return key;
}

/**
 * Create a Supabase client with the user's JWT token from Clerk
 */
export async function createSupabaseClient() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase credentials');
  }
  
  // First, try to get the user's token from the Clerk session
  const token = await getUserToken();
  
  // Create a Supabase client with the token if available
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: token 
        ? { Authorization: `Bearer ${token}` }
        : undefined
    }
  });
}

/**
 * Get the user's JWT token for Supabase from Clerk
 * This function should be used inside a component with access to Clerk's hooks
 */
export function useSupabaseToken() {
  const { getToken, isSignedIn } = useAuth();
  
  const getSupabaseToken = async () => {
    if (!isSignedIn) return null;
    
    try {
      // Get a JWT compatible with Supabase from Clerk
      const token = await getToken({ template: 'supabase' });
      return token;
    } catch (error) {
      console.error('Error getting Supabase token from Clerk:', error);
      return null;
    }
  };
  
  return { getSupabaseToken };
}

/**
 * Get the user's JWT token for Supabase
 * This is a standalone version for non-hook contexts
 */
export async function getUserToken(): Promise<string | null> {
  // This needs to be called within a React component that has access to Clerk's context
  // Outside of React components, this will return null
  return null;
}

/**
 * Function to check if a user is authenticated
 * TODO: Implement using Clerk's session management
 */
export function isAuthenticated(): boolean {
  // This is a placeholder. Implement using Clerk's session management
  return false;
}

/**
 * Function to get the current user
 * TODO: Implement using Clerk's user management
 */
export function getCurrentUser() {
  // This is a placeholder. Implement using Clerk's user management
  return null;
} 