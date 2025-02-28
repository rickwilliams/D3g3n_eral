import { useQuery } from "@tanstack/react-query";
import { Cog, Plus, Bot } from "lucide-react";
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
import { Link } from "@tanstack/react-router";
import type { UUID } from "@elizaos/core";
import { formatAgentName } from "@/lib/utils";
import { createSupabaseClient } from "@/lib/auth";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "@tanstack/react-router";

// Define the character type based on the accounts table structure
type Character = {
    id: string;
    name: string;
    username?: string;
    avatarUrl?: string;
    details: any;
    user_id: string;
};

// Function to fetch agents from the agents API
function useAgentsQuery() {
    return useQuery({
        queryKey: ['agents'],
        queryFn: async () => {
            const response = await apiClient.getAgents();
            // Ensure we return an array even if the API returns something else
            return Array.isArray(response) ? response : [];
        }
    });
}

export default function Home() {
    const query = useAgentsQuery();
    const [characters, setCharacters] = useState<Character[]>([]);
    const [loading, setLoading] = useState(true);
    const { user, isSignedIn } = useUser();
    const navigate = useNavigate();

    // Fetch characters from Supabase
    const fetchCharacters = async () => {
        if (!isSignedIn) return;
        
        try {
            setLoading(true);
            const supabase = await createSupabaseClient();
            const { data, error } = await supabase
                .from('accounts')
                .select('*')
                .eq('user_id', user?.id);
            
            if (error) {
                console.error('Error fetching characters:', error);
                return;
            }
            
            setCharacters(data || []);
        } catch (error) {
            console.error('Failed to fetch characters:', error);
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        fetchCharacters();
    }, [isSignedIn, user?.id]);
    
    const agents = query?.data || [];

    const handleCreateCharacter = () => {
        navigate({ to: "/create-character" });
    };

    const handleChatClick = (agentId: UUID) => {
        navigate({ 
            to: "/chat/$agentId",
            params: { agentId }
        });
    };

    return (
        <div className="flex flex-col gap-4 h-full p-4">
            <div className="flex justify-between items-center">
                <PageTitle title="Your Characters" />
                <Button onClick={handleCreateCharacter}>
                    <Plus className="mr-2 h-4 w-4" /> Create Character
                </Button>
            </div>
            
            {/* Loading state */}
            {loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map(index => (
                        <Card key={index} className="h-[200px] animate-pulse">
                            <CardHeader className="bg-muted/20"></CardHeader>
                            <CardContent className="flex-1"></CardContent>
                            <CardFooter className="bg-muted/10"></CardFooter>
                        </Card>
                    ))}
                </div>
            )}
            
            {/* Display characters */}
            {!loading && (characters.length > 0 || agents?.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {characters.map(character => (
                        <Card key={character.id} className="flex flex-col h-[200px]">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    {character.name}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <p className="text-sm text-muted-foreground">
                                    {character.details?.bio?.[0] || "No description provided."}
                                </p>
                            </CardContent>
                            <CardFooter className="flex justify-between">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => {
                                        // TODO: Implement character editing
                                        alert("Edit functionality coming soon!");
                                    }}
                                >
                                    <Cog className="h-4 w-4 mr-2" />
                                    Settings
                                </Button>
                                
                                <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => {
                                        // TODO: Implement chat functionality
                                        alert("Chat functionality coming soon!");
                                    }}
                                >
                                    Chat
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                    
                    {/* List agents from the agents API */}
                    {Array.isArray(agents) && agents.map((agent: { id: UUID; name: string }) => (
                        <Card key={agent.id} className="flex flex-col h-[200px]">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    {formatAgentName(agent.name)}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <p className="text-sm text-muted-foreground">
                                    System character from ElizaOS
                                </p>
                            </CardContent>
                            <CardFooter className="flex justify-end">
                                <Link 
                                    to="/chat/$agentId"
                                    params={{ agentId: agent.id }}
                                >
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="w-full"
                                    >
                                        Chat
                                    </Button>
                                </Link>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
            
            {/* Show empty state */}
            {!loading && !characters.length && !agents?.length && (
                <div className="flex flex-col items-center justify-center h-40 gap-4">
                    <Bot className="h-12 w-12 text-muted-foreground" />
                    <p className="text-muted-foreground">No characters found</p>
                    <Button onClick={handleCreateCharacter}>
                        Create Your First Character
                    </Button>
                </div>
            )}
        </div>
    );
}
