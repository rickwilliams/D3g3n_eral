import "./index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./components/app-sidebar";
import { TooltipProvider } from "./components/ui/tooltip";
import { Toaster } from "./components/ui/toaster";
import { BrowserRouter, Route, Routes } from "react-router";
import Chat from "./routes/chat";
import Overview from "./routes/overview";
import Home from "./routes/home";
import useVersion from "./hooks/use-version";
import { ClerkProvider } from "@clerk/clerk-react";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { SignIn } from "./components/auth/SignIn";
import { SignUp } from "./components/auth/SignUp";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: Number.POSITIVE_INFINITY,
        },
    },
});

// Get the Clerk publishable key from environment variables
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string;

function App() {
    useVersion();
    return (
        <ClerkProvider publishableKey={clerkPubKey}>
            <QueryClientProvider client={queryClient}>
                <div
                    className="dark antialiased"
                    style={{
                        colorScheme: "dark",
                    }}
                >
                    <BrowserRouter>
                        <TooltipProvider delayDuration={0}>
                            <SidebarProvider>
                                <AppSidebar />
                                <SidebarInset>
                                    <div className="flex flex-1 flex-col gap-4 size-full container">
                                        <Routes>
                                            <Route path="/" element={<Home />} />
                                            <Route path="/sign-in" element={<SignIn />} />
                                            <Route path="/sign-up" element={<SignUp />} />
                                            <Route
                                                path="chat/:agentId"
                                                element={
                                                    <ProtectedRoute>
                                                        <Chat />
                                                    </ProtectedRoute>
                                                }
                                            />
                                            <Route
                                                path="settings/:agentId"
                                                element={
                                                    <ProtectedRoute>
                                                        <Overview />
                                                    </ProtectedRoute>
                                                }
                                            />
                                        </Routes>
                                    </div>
                                </SidebarInset>
                            </SidebarProvider>
                            <Toaster />
                        </TooltipProvider>
                    </BrowserRouter>
                </div>
            </QueryClientProvider>
        </ClerkProvider>
    );
}

export default App;
