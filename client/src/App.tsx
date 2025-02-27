import "./index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./components/app-sidebar";
import { TooltipProvider } from "./components/ui/tooltip";
import { Toaster } from "./components/ui/toast";
import { ToastProvider } from "./components/ui/toast";
import { BrowserRouter, Route, Routes } from "react-router";
import Chat from "./routes/chat";
import Overview from "./routes/overview";
import Home from "./routes/home";
import SignInPage from "./routes/sign-in";
import SignUpPage from "./routes/sign-up";
import ProfilePage from "./routes/profile";
import CreateCharacterPage from "./routes/create-character";
import useVersion from "./hooks/use-version";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: Number.POSITIVE_INFINITY,
        },
    },
});

function App() {
    useVersion();
    return (
        <QueryClientProvider client={queryClient}>
            <div>
                <BrowserRouter>
                    <TooltipProvider delayDuration={0}>
                        <ToastProvider>
                            <SidebarProvider>
                                <AppSidebar />
                                <SidebarInset>
                                    <div className="flex flex-1 flex-col gap-4 size-full container">
                                        <Routes>
                                            <Route path="/" element={<Home />} />
                                            <Route
                                                path="chat/:agentId"
                                                element={<Chat />}
                                            />
                                            <Route
                                                path="settings/:agentId"
                                                element={<Overview />}
                                            />
                                            <Route
                                                path="sign-in"
                                                element={<SignInPage />}
                                            />
                                            <Route
                                                path="sign-in/*"
                                                element={<SignInPage />}
                                            />
                                            <Route
                                                path="sign-up"
                                                element={<SignUpPage />}
                                            />
                                            <Route
                                                path="sign-up/*"
                                                element={<SignUpPage />}
                                            />
                                            <Route
                                                path="profile"
                                                element={<ProfilePage />}
                                            />
                                            <Route
                                                path="create-character"
                                                element={<CreateCharacterPage />}
                                            />
                                        </Routes>
                                    </div>
                                </SidebarInset>
                            </SidebarProvider>
                            <Toaster />
                        </ToastProvider>
                    </TooltipProvider>
                </BrowserRouter>
            </div>
        </QueryClientProvider>
    );
}

export default App;
