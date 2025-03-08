import { useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { setupTokenRetrieval } from '../lib/supabase-client';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { getToken, isSignedIn } = useAuth();
  
  // Set up token retrieval for non-component contexts
  useEffect(() => {
    if (getToken && isSignedIn !== undefined) {
      console.log('Setting up token retrieval with isSignedIn:', isSignedIn);
      setupTokenRetrieval(getToken, isSignedIn);
    }
  }, [getToken, isSignedIn]);
  
  return <>{children}</>;
} 