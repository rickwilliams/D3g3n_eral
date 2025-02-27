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
import { NavLink } from "react-router";
import type { UUID } from "@elizaos/core";
import { formatAgentName } from "@/lib/utils";
import { createSupabaseClient } from "@/lib/auth";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";

// Define the character type based on the accounts table structure
type Character = {
    id: string;
    name: string;
    username?: string;
    avatarUrl?: string;
    details: any;
    user_id: string;
};

export default function Home() {
    const query = useQuery({
        queryKey: ["agents"],
        queryFn: () => apiClient.getAgents(),
        refetchInterval: 5_000
    });

    const { user } = useUser();
    const [characters, setCharacters] = useState<Character[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch characters from the accounts table
    useEffect(() => {
        const fetchCharacters = async () => {
            if (!user) return;
            
            try {
                const supabase = await createSupabaseClient();
                const { data, error } = await supabase
                    .from('accounts')
                    .select('*')
                    .eq('user_id', user.id);
                
                if (error) {
                    console.error('Error fetching characters:', error);
                } else {
                    setCharacters(data || []);
                }
            } catch (error) {
                console.error('Failed to fetch characters:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCharacters();
    }, [user]);

    const agents = query?.data?.agents;

    return (
        <div className="flex flex-col gap-4 h-full p-4">
            <div className="flex justify-between items-center">
                <PageTitle title="Your Characters" />
                <NavLink to="/create-character">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Create Character
                    </Button>
                </NavLink>
            </div>
            
            {/* Display characters from accounts table */}
            {characters.length > 0 && (
                <>
                    <h2 className="text-xl font-semibold mt-2">Your Custom Characters</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {characters.map((character) => (
                            <Card key={character.id}>
                                <CardHeader>
                                    <CardTitle>{character.name}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="rounded-md bg-muted aspect-square w-full grid place-items-center overflow-hidden">
                                        {character.avatarUrl ? (
                                            <img 
                                                src={character.avatarUrl} 
                                                alt={character.name}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                    const parent = (e.target as HTMLImageElement).parentElement;
                                                    if (parent) {
                                                        const div = document.createElement('div');
                                                        div.className = 'text-6xl font-bold uppercase';
                                                        div.textContent = formatAgentName(character.name);
                                                        parent.appendChild(div);
                                                    }
                                                }}
                                            />
                                        ) : (
                                            <div className="text-6xl font-bold uppercase">
                                                {formatAgentName(character.name)}
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <div className="flex items-center gap-4 w-full">
                                        <NavLink
                                            to={`/chat?character=${character.id}`}
                                            className="w-full grow"
                                        >
                                            <Button
                                                variant="outline"
                                                className="w-full grow"
                                            >
                                                Chat
                                            </Button>
                                        </NavLink>
                                        <Button size="icon" variant="outline">
                                            <Cog />
                                        </Button>
                                    </div>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </>
            )}
            
            {/* Display system agents */}
            {agents && agents.length > 0 && (
                <>
                    <h2 className="text-xl font-semibold mt-4">System Agents</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {agents?.map((agent: { id: UUID; name: string }) => (
                            <Card key={agent.id}>
                                <CardHeader>
                                    <CardTitle>{agent?.name}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="rounded-md bg-muted aspect-square w-full grid place-items-center">
                                        <div className="text-6xl font-bold uppercase">
                                            {formatAgentName(agent?.name)}
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <div className="flex items-center gap-4 w-full">
                                        <NavLink
                                            to={`/chat/${agent.id}`}
                                            className="w-full grow"
                                        >
                                            <Button
                                                variant="outline"
                                                className="w-full grow"
                                            >
                                                Chat
                                            </Button>
                                        </NavLink>
                                        <NavLink
                                            to={`/settings/${agent.id}`}
                                            key={agent.id}
                                        >
                                            <Button size="icon" variant="outline">
                                                <Cog />
                                            </Button>
                                        </NavLink>
                                    </div>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </>
            )}
            
            {/* Show loading state */}
            {loading && !characters.length && !agents?.length && (
                <div className="flex justify-center items-center h-40">
                    <p>Loading characters...</p>
                </div>
            )}
            
            {/* Show empty state */}
            {!loading && !characters.length && !agents?.length && (
                <div className="flex flex-col items-center justify-center h-40 gap-4">
                    <Bot className="h-12 w-12 text-muted-foreground" />
                    <p className="text-muted-foreground">No characters found</p>
                    <NavLink to="/create-character">
                        <Button>Create Your First Character</Button>
                    </NavLink>
                </div>
            )}
        </div>
    );
}
