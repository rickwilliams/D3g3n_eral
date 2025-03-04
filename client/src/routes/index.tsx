import { Outlet, Router, Route, RootRoute } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ClerkProvider } from "@clerk/clerk-react";
import App from "../App";
import Chat from "./chat";
import Home from "./home";
import SignIn from "./sign-in";
import SignUp from "./sign-up";
import CreateCharacterPage from "./create-character";
import EditCharacterPage from "./edit-character";
import { Toaster } from "../components/ui/toaster";

// Create a client
export const queryClient = new QueryClient();

// Create the router configuration
const rootRoute = new RootRoute({
  component: () => (
    <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
      <QueryClientProvider client={queryClient}>
        <App />
        <Toaster />
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
  component: CreateCharacterPage,
});

const editCharacterRoute = new Route({
  getParentRoute: () => layoutRoute,
  path: "/edit-character/$characterId",
  component: EditCharacterPage,
});

const chatRoute = new Route({
  getParentRoute: () => layoutRoute,
  path: "/chat/$agentId",
  component: Chat,
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