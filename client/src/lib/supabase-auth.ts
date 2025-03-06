// TODO: Install @supabase/ssr package
// import { createBrowserClient, createServerClient } from '@supabase/ssr';
import { createBrowserClient } from '@supabase/ssr';
import { getUserToken } from './auth';

/**
 * Creates a Supabase client for browser usage with Clerk authentication
 * This follows the @supabase/ssr pattern as specified in the rules
 */
export async function createSupabaseClient() {
  try {
    // Get the token from Clerk for Supabase authentication
    const clerkToken = await getUserToken();
    
    const client = createBrowserClient(
      import.meta.env.VITE_SUPABASE_URL as string,
      import.meta.env.VITE_SUPABASE_ANON_KEY as string,
      {
        global: {
          // Using fetch override to add the Clerk token to requests
          fetch: async (url: string, options: RequestInit = {}) => {
            const headers = new Headers(options?.headers);
            
            if (clerkToken) {
              // Add the Clerk JWT token to the Authorization header
              headers.set('Authorization', `Bearer ${clerkToken}`);
            }
            
            return fetch(url, { ...options, headers });
          }
        }
      }
    );
    
    return client;
  } catch (error) {
    console.error('Error creating Supabase client:', error);
    return null;
  }
}

/**
 * Function to check if the current user is the owner of an agent
 * @param agentId The ID of the agent to check
 * @returns Promise<boolean> True if the user is the owner
 */
export async function isAgentOwner(agentId: string): Promise<boolean> {
  try {
    const supabase = await createSupabaseClient();
    
    if (!supabase) {
      console.error('Supabase client not initialized');
      return false;
    }
    
    const { data, error } = await supabase
      .from('accounts')
      .select('user_id')
      .eq('id', agentId)
      .eq('is_agent', true)
      .single();
      
    if (error) {
      console.error('Error checking agent ownership:', error);
      return false;
    }
    
    // Compare with the current user ID from Clerk
    // This assumes that auth.uid() in Supabase is set to the Clerk user ID
    const { data: userData } = await supabase.auth.getUser();
    return data?.user_id === userData?.user?.id;
  } catch (error) {
    console.error('Error checking agent ownership:', error);
    return false;
  }
} 