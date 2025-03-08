import "./index.css";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./components/app-sidebar";
import { TooltipProvider } from "./components/ui/tooltip";
import { Toaster } from "./components/ui/toaster";
import useVersion from "./hooks/use-version";
import { Outlet } from "@tanstack/react-router";
import { useAuth } from "@clerk/clerk-react";
import { setupTokenRetrieval } from "./lib/supabase-client";
import { useEffect } from "react";

function App() {
    useVersion();
    const { isSignedIn, getToken } = useAuth();
    
    // Set up token retrieval globally when the app first loads
    useEffect(() => {
        console.log('App component initialized, auth state:', { isSignedIn, hasGetTokenFn: !!getToken });
        
        // Function to set up auth with retry logic
        const setupAuthWithRetry = async (retryCount = 0, maxRetries = 3) => {
            if (isSignedIn === undefined) {
                console.log('Auth state is still loading, waiting...');
                if (retryCount < maxRetries) {
                    // Wait and retry
                    setTimeout(() => setupAuthWithRetry(retryCount + 1, maxRetries), 1000);
                }
                return;
            }
            
            if (isSignedIn && getToken) {
                console.log('Setting up global token retrieval in App component');
                const success = setupTokenRetrieval(getToken, isSignedIn);
                console.log('Token retrieval setup result:', success ? 'SUCCESS' : 'FAILED');
                
                // Immediately try to get a token to confirm it works
                try {
                    const token = await getToken({ template: 'supabase' });
                    console.log('Initial token retrieval:', token ? 'SUCCESS' : 'FAILED');
                    
                    // If token retrieval failed but we haven't exceeded retries, try again
                    if (!token && retryCount < maxRetries) {
                        console.log(`Token retrieval failed, retrying (${retryCount + 1}/${maxRetries})...`);
                        setTimeout(() => setupAuthWithRetry(retryCount + 1, maxRetries), 1000);
                    }
                } catch (error) {
                    console.error('Error in initial token retrieval:', error);
                    if (retryCount < maxRetries) {
                        console.log(`Error in token retrieval, retrying (${retryCount + 1}/${maxRetries})...`);
                        setTimeout(() => setupAuthWithRetry(retryCount + 1, maxRetries), 1000);
                    }
                }
            } else if (isSignedIn === false) {
                console.log('User is not signed in');
            } else {
                console.log('Token function is unavailable');
                if (retryCount < maxRetries) {
                    console.log(`Token function unavailable, retrying (${retryCount + 1}/${maxRetries})...`);
                    setTimeout(() => setupAuthWithRetry(retryCount + 1, maxRetries), 1000);
                }
            }
        };
        
        // Start the setup process
        setupAuthWithRetry();
    }, [isSignedIn, getToken]);
    
    return (
        <div className="min-h-screen bg-background">
            <TooltipProvider delayDuration={0}>
                <SidebarProvider>
                    <AppSidebar />
                    <SidebarInset>
                        <div className="flex flex-1 flex-col gap-4 size-full container">
                            {/* TanStack Router will render the route content here */}
                            <Outlet />
                        </div>
                    </SidebarInset>
                </SidebarProvider>
            </TooltipProvider>
        </div>
    );
}

export default App;
