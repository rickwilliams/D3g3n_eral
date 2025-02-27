import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useSupabase } from '../hooks/useSupabase';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  username: string;
  avatarUrl: string;
}

interface UserProfileContextValue {
  userProfile: UserProfile | null;
  isLoading: boolean;
  error: Error | null;
  refreshProfile: () => Promise<void>;
}

const UserProfileContext = createContext<UserProfileContextValue | undefined>(undefined);

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const { userId, isSignedIn, isLoaded } = useAuth();
  const { supabase, isLoading: isSupabaseLoading } = useSupabase();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  async function fetchUserProfile() {
    if (!supabase || !userId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) throw error;
      
      setUserProfile(data as UserProfile);
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }
  
  async function refreshProfile() {
    await fetchUserProfile();
  }
  
  useEffect(() => {
    if (isLoaded && isSignedIn && supabase && !isSupabaseLoading) {
      fetchUserProfile();
    }
  }, [isLoaded, isSignedIn, supabase, isSupabaseLoading]);
  
  return (
    <UserProfileContext.Provider value={{ userProfile, isLoading, error, refreshProfile }}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  const context = useContext(UserProfileContext);
  if (context === undefined) {
    throw new Error('useUserProfile must be used within a UserProfileProvider');
  }
  return context;
} 