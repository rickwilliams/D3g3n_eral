import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bot, Cog, RefreshCw } from "lucide-react";
import PageTitle from "@/components/page-title";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { apiClient } from "@/lib/api";
import { Link, useRouter } from "@tanstack/react-router";
import type { UUID } from "@elizaos/core";
import { formatAgentName } from "@/lib/utils";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useEffect } from "react";

// List of default characters that anyone can chat with
// Note: we now use lowercase to ensure case-insensitive matching
const DEFAULT_CHARACTERS = ["snoop", "d3g3n_eral"]; 

// Define the agent type to match the database structure
interface Agent {
    id: UUID;
    name: string;
    username?: string;
    email?: string;
    avatarUrl?: string;
    details?: any;
    user_id?: string;
    createdAt?: string;
}

// Define the Character type from user-management-api
interface UserCharacter {
    id: string;
    name: string;
    avatarUrl?: string;
    created_at?: string;
    updated_at?: string;
    user_id?: string; // Make user_id optional to match CharacterSummary
    bio?: string[]; // Add bio array to display first line
    isBuiltIn?: boolean; // Flag to indicate if this is a built-in character
    isOwnedByUser?: boolean; // Flag to indicate if this is the user's own character
}

export default function Home() {
    const router = useRouter();
    const { isLoaded, isSignedIn } = useAuth();
    const { user } = useUser();
    const queryClient = useQueryClient();
    
    // Store user ID in localStorage for API requests
    useEffect(() => {
        if (isSignedIn && user) {
            localStorage.setItem('userId', user.id);
        }
    }, [isSignedIn, user]);
    
    // Query for default agents (ElizaOS agents)
    const agentQuery = useQuery({
        queryKey: ["agents"],
        queryFn: () => apiClient.getAgents(),
        refetchInterval: 5000,
        staleTime: 1000, // Consider data stale after 1 second
        refetchOnMount: true,
        refetchOnWindowFocus: true
    });

    // New query for user-created characters from user-management-api
    const charactersQuery = useQuery({
        queryKey: ["userCharacters"],
        queryFn: () => apiClient.getUserCharacters(),
        enabled: isSignedIn, // Only run query if user is signed in
        refetchInterval: 10000,
        staleTime: 1000,
        refetchOnMount: true,
        refetchOnWindowFocus: true
    });

    // Refetch agents when component mounts or auth state changes
    useEffect(() => {
        if (isLoaded) {
            // Force a refetch when the component mounts and auth is loaded
            queryClient.invalidateQueries({ queryKey: ["agents"] });
            
            if (isSignedIn) {
                queryClient.invalidateQueries({ queryKey: ["userCharacters"] });
            }
        }
    }, [isLoaded, isSignedIn, queryClient]);

    // Log user information for debugging
    useEffect(() => {
        if (isSignedIn && user) {
            console.log("Current logged-in user:", user.id);
            console.log("Full user object:", user);
        }
    }, [isSignedIn, user]);

    const agents = agentQuery?.data?.agents || [];
    const allCharacters = charactersQuery?.data || [];
    const isAgentsLoading = agentQuery.isPending;
    const isCharactersLoading = charactersQuery.isPending;

    // Filter characters into different categories
    // 1. Demo characters - where isBuiltIn is true AND isOwnedByUser is false
    const demoCharacters = allCharacters.filter(character => 
        character.isBuiltIn === true && character.isOwnedByUser === false
    );

    // 2. User's own characters - where isOwnedByUser is true
    const userCharacters = allCharacters.filter(character => 
        character.isOwnedByUser === true
    );

    // Filter agents into different categories using case-insensitive comparison
    const defaultAgents = agents.filter((agent: Agent) => {
        // Case-insensitive comparison with default character names
        return DEFAULT_CHARACTERS.some(defaultName => 
            agent.name?.toLowerCase() === defaultName.toLowerCase()
        );
    });

    console.log("Default agents:", defaultAgents);
    console.log("Demo characters:", demoCharacters);
    console.log("User's own characters:", userCharacters);

    const handleCreateCharacter = () => {
        if (!isSignedIn) {
            router.navigate({ to: "/sign-in" });
        } else {
            router.navigate({ to: "/create-character" });
        }
    };

    // Handler to manually refresh agents
    const handleRefresh = async () => {
        console.log("Manually refreshing agents and characters...");
        await queryClient.invalidateQueries({ queryKey: ["agents"] });
        await queryClient.refetchQueries({ queryKey: ["agents"] });
        
        if (isSignedIn) {
            // Add a timestamp to force a fresh fetch, bypassing any cache
            const timestamp = Date.now();
            await queryClient.invalidateQueries({ queryKey: ["userCharacters"] });
            await queryClient.resetQueries({ queryKey: ["userCharacters"] });
            await queryClient.refetchQueries({ 
                queryKey: ["userCharacters", { timestamp }],
                type: 'active'
            });
            console.log("Character data refresh requested with timestamp:", timestamp);
        }
    };

    // Handler to log API response for debugging
    const handleLogResponse = () => {
        console.log("Full agents API response:", agentQuery.data);
        console.log("Full user characters API response:", charactersQuery.data);
        console.log("Query state:", {
            agentsLoading: agentQuery.isLoading,
            charactersLoading: charactersQuery.isLoading,
            agentsError: agentQuery.isError,
            charactersError: charactersQuery.isError
        });
        console.log("Current user ID:", user?.id);
    };

    // Render default characters for unauthenticated and authenticated users
    const renderDefaultCharacters = () => {
        // Use demoCharacters from our filtered list
        if (!demoCharacters || demoCharacters.length === 0) {
            return null;
        }

        return (
            <div className="mt-6">
                <h2 className="text-xl font-semibold mb-4">Demo Characters</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {demoCharacters.map((character) => (
                        <Card key={character.id}>
                            <CardHeader>
                                <CardTitle>{character.name}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div 
                                    className="rounded-md aspect-square w-full overflow-hidden relative" 
                                    style={{
                                        backgroundImage: character.avatarUrl ? `url(${character.avatarUrl})` : 'none',
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center'
                                    }}
                                >
                                    {!character.avatarUrl && (
                                        <div className="absolute inset-0 bg-muted grid place-items-center">
                                            <div className="text-6xl font-bold uppercase">
                                                {formatAgentName(character.name)}
                                            </div>
                                        </div>
                                    )}
                                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white p-2">
                                        <div className="font-semibold">{character.name}</div>
                                        {character.bio && (
                                            <div className="text-sm truncate">
                                                {Array.isArray(character.bio) ? character.bio[0] : character.bio}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Link
                                    to="/chat/$agentId"
                                    params={{ agentId: character.id }}
                                    className="w-full"
                                >
                                    <Button className="w-full">
                                        Chat
                                    </Button>
                                </Link>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>
        );
    };

    const renderAuthenticatedContent = () => {
        if (isCharactersLoading) {
            return (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {Array.from({ length: 5 }).map((_, index) => (
                        <Card key={`skeleton-${index}`} className="opacity-50">
                            <CardHeader>
                                <CardTitle className="h-6 bg-muted rounded animate-pulse" />
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-md aspect-square w-full bg-muted animate-pulse" />
                            </CardContent>
                            <CardFooter>
                                <div className="w-full h-9 bg-muted rounded animate-pulse" />
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            );
        }

        if (userCharacters && userCharacters.length > 0) {
            console.log("Rendering user characters:", userCharacters);
            return (
                <div className="grid gap-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">Your Characters</h2>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {userCharacters.map((character) => (
                            <Card key={character.id} className="overflow-hidden">
                                <CardHeader>
                                    <CardTitle>{character.name}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div 
                                        className="rounded-md aspect-square w-full overflow-hidden relative" 
                                        style={{
                                            backgroundImage: character.avatarUrl ? `url(${character.avatarUrl})` : 'none',
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center'
                                        }}
                                    >
                                        {!character.avatarUrl && (
                                            <div className="absolute inset-0 bg-muted grid place-items-center">
                                                <div className="text-6xl font-bold uppercase">
                                                    {formatAgentName(character.name)}
                                                </div>
                                            </div>
                                        )}
                                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white p-2">
                                            <div className="font-semibold">{character.name}</div>
                                            {character.bio && (
                                                <div className="text-sm truncate">
                                                    {Array.isArray(character.bio) ? character.bio[0] : character.bio}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="flex justify-between">
                                    <Link
                                        to="/chat/$agentId"
                                        params={{ agentId: character.id }}
                                        className="flex-1 mr-2"
                                    >
                                        <Button className="w-full">
                                            Chat
                                        </Button>
                                    </Link>
                                    
                                    {/* Only show Edit button for user's own characters */}
                                    {character.isOwnedByUser && (
                                        <Link
                                            to="/edit-character/$characterId"
                                            params={{ characterId: character.id }}
                                            className="flex-shrink-0"
                                        >
                                            <Button variant="outline">
                                                Edit
                                            </Button>
                                        </Link>
                                    )}
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </div>
            );
        }

        return (
            <div className="flex flex-col items-center justify-center h-40 gap-4">
                <Bot className="h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">No characters found</p>
                <Button onClick={handleCreateCharacter}>
                    Create Your First Character
                </Button>
            </div>
        );
    };

    const renderUnauthenticatedContent = () => {
        return (
            <div className="flex flex-col items-center justify-center h-40 gap-4">
                <Bot className="h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">Sign in to create and view your characters</p>
                <Button onClick={() => router.navigate({ to: "/sign-in" })}>
                    Sign In
                </Button>
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-4 h-full p-4">
            <div className="flex justify-between items-center">
                <PageTitle title="Agents" />
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleRefresh} size="icon" title="Refresh characters">
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button onClick={handleCreateCharacter}>
                        Create Character
                    </Button>
                </div>
            </div>
            
            {/* Always show default characters if they exist */}
            {renderDefaultCharacters()}
            
            {/* Show either the authenticated content or sign-in prompt */}
            {!isLoaded ? (
                <div className="flex justify-center p-8">Loading authentication...</div>
            ) : isSignedIn ? (
                renderAuthenticatedContent()
            ) : (
                renderUnauthenticatedContent()
            )}
        </div>
    );
}
