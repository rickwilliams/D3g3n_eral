// Type declarations for missing modules

declare module '@tanstack/react-router' {
  export function useNavigate(): (path: string) => void;
  // Add other exports as needed
}

declare module '@clerk/clerk-react' {
  export function useAuth(): {
    isLoaded: boolean;
    userId: string | null;
    sessionId: string | null;
    getToken: (options?: { template?: string }) => Promise<string | null>;
  };
  
  export function useUser(): {
    isLoaded: boolean;
    isSignedIn: boolean;
    user: {
      id: string;
      firstName?: string;
      lastName?: string;
      imageUrl?: string;
      emailAddresses?: Array<{ emailAddress: string }>;
    } | null;
  };
  
  export function SignIn(props: any): JSX.Element;
  export function SignUp(props: any): JSX.Element;
  // Add other exports as needed
}

declare module '@hookform/resolvers/zod' {
  export function zodResolver(schema: any): any;
}

declare module 'react-hook-form' {
  export function useForm(options?: any): any;
  // Add other exports as needed
}

declare module '@supabase/ssr' {
  export function createBrowserClient(
    supabaseUrl: string,
    supabaseKey: string,
    options?: any
  ): any;
  
  export function createServerClient(
    supabaseUrl: string,
    supabaseKey: string,
    options?: any
  ): any;
} 