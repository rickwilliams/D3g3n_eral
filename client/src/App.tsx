import "./index.css";
import { QueryClient } from "@tanstack/react-query";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./components/app-sidebar";
import { TooltipProvider } from "./components/ui/tooltip";
import { Toaster } from "./components/ui/toast";
import { ToastProvider } from "./components/ui/toast";
import useVersion from "./hooks/use-version";
import { Outlet } from "@tanstack/react-router";

// Create a client for React Query
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: Number.POSITIVE_INFINITY,
        },
    },
});

function App() {
    useVersion();
    return (
        <div>
            <TooltipProvider delayDuration={0}>
                <ToastProvider>
                    <SidebarProvider>
                        <AppSidebar />
                        <SidebarInset>
                            <div className="flex flex-1 flex-col gap-4 size-full container">
                                {/* TanStack Router will render the route content here */}
                                <Outlet />
                            </div>
                        </SidebarInset>
                    </SidebarProvider>
                    <Toaster />
                </ToastProvider>
            </TooltipProvider>
        </div>
    );
}

export default App;
