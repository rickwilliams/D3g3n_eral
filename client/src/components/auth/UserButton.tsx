import { UserButton as ClerkUserButton } from '@clerk/clerk-react';

export function UserButton() {
  return (
    <ClerkUserButton 
      appearance={{
        elements: {
          userButtonAvatarBox: "h-8 w-8"
        }
      }}
    />
  );
}