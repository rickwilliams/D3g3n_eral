import { createBrowserClient } from '@supabase/ssr';
import { useAuth } from '@clerk/clerk-react';

// Store token retrieval function reference
let _getTokenFn: ((opts?: {template?: string}) => Promise<string | null>) | null = null;
let _isSignedIn: boolean | null = null;

/**
 * Setup token retrieval for non-component contexts
 */
export function setupTokenRetrieval(
  getToken: ((opts?: {template?: string}) => Promise<string | null>),
  isSignedIn: boolean
): boolean {
  _getTokenFn = getToken;
  _isSignedIn = isSignedIn;
  return true;
}

/**
 * Get the user's JWT token for Supabase
 */
export async function getUserToken(): Promise<string | null> {
  if (!_getTokenFn || !_isSignedIn) {
    console.warn('Token retrieval not properly initialized or user not signed in');
    return null;
  }

  try {
    return await _getTokenFn({ template: 'supabase' });
  } catch (error) {
    console.error('Error getting user token:', error);
    return null;
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
      return await getToken({ template: 'supabase' });
    } catch (error) {
      console.error('Error getting Supabase token from Clerk:', error);
      return null;
    }
  };
  
  return { getSupabaseToken };
}

/**
 * Create a Supabase client with the user's JWT token from Clerk
 * This is the ONLY function that should be used to create a Supabase client
 */
export async function createSupabaseClient() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase credentials from environment variables');
    throw new Error('Missing Supabase credentials');
  }
  
  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      global: {
        fetch: async (url, options = {}) => {
          try {
            // Get a fresh Clerk JWT with the Supabase template for each request
            const clerkToken = await getUserToken();
            
            if (!clerkToken) {
              console.warn('No Clerk token available for Supabase authentication');
              // Continue without token - will be limited by RLS
            }
            
            // Create new headers, preserving the existing ones
            const headers = new Headers(options?.headers);
            
            // Set the Authorization header with the Clerk JWT token if available
            if (clerkToken) {
              headers.set('Authorization', `Bearer ${clerkToken}`);
            }
            
            // Return the modified fetch request
            return fetch(url, {
              ...options,
              headers,
            });
          } catch (error) {
            console.error('Error in Supabase fetch override:', error);
            throw error;
          }
        },
      },
    },
  );
}

/**
 * Function to check if a user is authenticated
 */
export function isAuthenticated(): boolean {
  return _isSignedIn === true;
} 