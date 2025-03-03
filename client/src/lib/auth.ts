/**
 * Authentication utilities for integrating Clerk with Supabase
 */
import { createBrowserClient } from '@supabase/ssr';
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
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase credentials from environment variables');
      throw new Error('Missing Supabase credentials');
    }
    
    // Create a Supabase client
    const client = createBrowserClient(supabaseUrl, supabaseAnonKey);
    
    // Get the token if available
    const token = await getUserToken();
    
    if (token) {
      // Set the auth session with the token
      await client.auth.setSession({
        access_token: token,
        refresh_token: ''
      });
    }
    
    return client;
  } catch (error) {
    console.error('Error creating Supabase client:', error);
    throw new Error(`Failed to create Supabase client: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Hook to get the Supabase token from Clerk
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

// Store a reference to getToken if available
let _getTokenFn: ((opts?: {template?: string}) => Promise<string | null>) | null = null;
let _isSignedIn: boolean | null = null;

/**
 * Sets up token retrieval for non-component contexts
 */
export function setupTokenRetrieval(
  getToken: ((opts?: {template?: string}) => Promise<string | null>),
  isSignedIn: boolean
): boolean {
  try {
    if (!getToken) {
      console.warn('Token retrieval function is undefined');
      return false;
    }
    
    _getTokenFn = getToken;
    _isSignedIn = isSignedIn;
    return true;
  } catch (error) {
    console.warn('Failed to set up token retrieval:', error);
    return false;
  }
}

/**
 * Get the user's JWT token for Supabase
 */
export async function getUserToken(): Promise<string | null> {
  try {
    if (_getTokenFn && _isSignedIn) {
      const token = await _getTokenFn({ template: 'supabase' });
      return token;
    }
    return null;
  } catch (error) {
    console.error('Error getting user token:', error);
    return null;
  }
}

/**
 * Function to check if a user is authenticated
 */
export function isAuthenticated(): boolean {
  return _isSignedIn === true; // Explicitly check for true to handle undefined cases
}

/**
 * Function to get the current user
 */
export function getCurrentUser() {
  return null; // Will be implemented with Clerk's user management
} 