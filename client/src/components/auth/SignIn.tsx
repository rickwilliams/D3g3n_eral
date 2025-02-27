import { SignIn as ClerkSignIn } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

export function SignIn() {
  const navigate = useNavigate();
  const redirectUrl = '/';
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md p-6 bg-card rounded-lg shadow-md">
        <h1 className="text-2xl font-semibold mb-4 text-center">Sign In</h1>
        <ClerkSignIn 
          routing="path" 
          path="/sign-in" 
          signUpUrl="/sign-up" 
          redirectUrl={redirectUrl}
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "w-full shadow-none p-0",
              formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90"
            }
          }}
        />
      </div>
    </div>
  );
}