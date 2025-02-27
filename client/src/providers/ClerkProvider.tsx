import { ClerkProvider as BaseClerkProvider } from '@clerk/clerk-react';
import { ReactNode } from 'react';
import { getClerkPublishableKey } from '../lib/auth';

interface ClerkProviderProps {
  children: ReactNode;
}

export function ClerkProvider({ children }: ClerkProviderProps) {
  const publishableKey = getClerkPublishableKey();
  
  if (!publishableKey) {
    return <div>Missing Clerk publishable key</div>;
  }
  
  return (
    <BaseClerkProvider publishableKey={publishableKey}>
      {children}
    </BaseClerkProvider>
  );
}