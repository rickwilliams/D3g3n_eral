import { useAuth } from '@clerk/clerk-react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

export function useSupabase() {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (!isLoaded) return;
    
    async function initSupabase() {
      try {
        setIsLoading(true);
        
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
        
        if (!supabaseUrl || !supabaseAnonKey) {
          throw new Error('Missing Supabase credentials');
        }
        
        let headers = {};
        
        if (isSignedIn) {
          const token = await getToken({ template: 'supabase' });
          if (token) {
            headers = {
              Authorization: `Bearer ${token}`
            };
          }
        }
        
        const client = createClient(supabaseUrl, supabaseAnonKey, {
          global: { headers }
        });
        
        setSupabase(client);
      } catch (error) {
        console.error('Error initializing Supabase client:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    initSupabase();
  }, [isLoaded, isSignedIn, getToken]);
  
  return { supabase, isLoading };
} 