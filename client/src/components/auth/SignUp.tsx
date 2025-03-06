import { SignUp as ClerkSignUp } from '@clerk/clerk-react';

export function SignUp() {
  const redirectUrl = '/';
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md p-6 bg-card rounded-lg shadow-md">
        <h1 className="text-2xl font-semibold mb-4 text-center">Sign Up</h1>
        <ClerkSignUp 
          routing="path" 
          path="/sign-up" 
          signInUrl="/sign-in" 
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