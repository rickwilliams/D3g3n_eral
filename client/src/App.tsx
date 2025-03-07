import "./index.css";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./components/app-sidebar";
import { TooltipProvider } from "./components/ui/tooltip";
import { Toaster } from "./components/ui/toaster";
import useVersion from "./hooks/use-version";
import { Outlet } from "@tanstack/react-router";

function App() {
    useVersion();
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
                <Toaster />
            </TooltipProvider>
        </div>
    );
}

export default App;
