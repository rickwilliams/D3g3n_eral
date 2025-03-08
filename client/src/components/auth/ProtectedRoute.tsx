import { useAuth } from '@clerk/clerk-react';
import { Navigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      toast({
        title: "Authentication required",
        description: "Please sign in to access this feature",
        variant: "destructive",
      });
    }
  }, [isLoaded, isSignedIn, toast]);

  if (!isLoaded) {
    return <div className="p-8 flex justify-center">Loading authentication...</div>;
  }
  
  if (!isSignedIn) {
    return <Navigate to="/sign-in" />;
  }
  
  return <>{children}</>;
}