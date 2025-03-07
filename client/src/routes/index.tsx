import { Outlet, Router, Route, RootRoute } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ClerkProvider } from "@clerk/clerk-react";
import App from "../App";
import Chat from "./chat";
import Home from "./home";
import Overview from "./overview";
import CreateCharacterPage from "./create-character";
import EditCharacterPage from "./edit-character";
import { SignIn } from "../components/auth/SignIn";
import { SignUp } from "../components/auth/SignUp";
import { ProtectedRoute } from "../components/auth/ProtectedRoute";

// Create a client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Number.POSITIVE_INFINITY,
    },
  },
});

// Create the router configuration
const rootRoute = new RootRoute({
  component: () => (
    <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </ClerkProvider>
  ),
});

// Create routes
const layoutRoute = new Route({
  getParentRoute: () => rootRoute,
  id: "layout",
  component: Outlet,
});

const indexRoute = new Route({
  getParentRoute: () => layoutRoute,
  path: "/",
  component: Home,
});

const createCharacterRoute = new Route({
  getParentRoute: () => layoutRoute,
  path: "/create-character",
  component: () => (
    <ProtectedRoute>
      <CreateCharacterPage />
    </ProtectedRoute>
  ),
});

const editCharacterRoute = new Route({
  getParentRoute: () => layoutRoute,
  path: "/edit-character/$characterId",
  component: () => (
    <ProtectedRoute>
      <EditCharacterPage />
    </ProtectedRoute>
  ),
});

const chatRoute = new Route({
  getParentRoute: () => layoutRoute,
  path: "/chat/$agentId",
  component: () => (
    <ProtectedRoute>
      <Chat />
    </ProtectedRoute>
  ),
});

const overviewRoute = new Route({
  getParentRoute: () => layoutRoute,
  path: "/settings/$agentId",
  component: () => (
    <ProtectedRoute>
      <Overview />
    </ProtectedRoute>
  ),
});

const signInRoute = new Route({
  getParentRoute: () => layoutRoute,
  path: "/sign-in",
  component: SignIn,
});

const signUpRoute = new Route({
  getParentRoute: () => layoutRoute,
  path: "/sign-up",
  component: SignUp,
});

// Create the route tree using your routes
const routeTree = rootRoute.addChildren([
  layoutRoute.addChildren([
    indexRoute,
    chatRoute,
    createCharacterRoute,
    editCharacterRoute,
    overviewRoute,
    signInRoute,
    signUpRoute,
  ]),
]);

// Create the router
export const router = new Router({ routeTree });

// Register your router for maximum type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
} 