import { useParams, useSearchParams } from "react-router";
import { useEffect, useState } from "react";
import Chat from "@/components/chat";
import type { UUID } from "@elizaos/core";
import { createSupabaseClient } from "@/lib/auth";
import { useUser } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router";

export default function ChatRoute() {
    const { agentId } = useParams<{ agentId: UUID }>();
    const [searchParams] = useSearchParams();
    const characterId = searchParams.get("character");
    const { user } = useUser();
    const [loading, setLoading] = useState(!!characterId);
    const [error, setError] = useState<string | null>(null);

    // If a character ID is provided in the URL, fetch the character from Supabase
    useEffect(() => {
        if (!characterId || !user) {
            setLoading(false);
            return;
        }

        const fetchCharacter = async () => {
            try {
                const supabase = await createSupabaseClient();
                const { data, error } = await supabase
                    .from('accounts')
                    .select('*')
                    .eq('id', characterId)
                    .eq('user_id', user.id)
                    .single();
                
                if (error) {
                    throw error;
                }
                
                if (!data) {
                    throw new Error("Character not found");
                }
                
                // Character found, but we don't need to set anything special here
                // since we'll just pass the ID to the Chat component
            } catch (error) {
                console.error('Error loading character:', error);
                setError(error instanceof Error ? error.message : "Failed to load character");
            } finally {
                setLoading(false);
            }
        };

        fetchCharacter();
    }, [characterId, user]);

    if (loading) {
        return <div className="flex justify-center items-center h-full">Loading character...</div>;
    }

    if (error) {
        return (
            <div className="flex flex-col justify-center items-center h-full gap-4">
                <p className="text-red-500">{error}</p>
                <Link to="/">
                    <Button variant="outline">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
                    </Button>
                </Link>
            </div>
        );
    }

    // If we have a characterId from search params, use that
    if (characterId) {
        // We're using the same Chat component but passing the characterId
        return <Chat agentId={characterId as UUID} isCustomCharacter={true} />;
    }

    // Otherwise, if we have an agentId from the URL params, use the regular agent chat
    if (agentId) {
        return <Chat agentId={agentId} />;
    }

    return (
        <div className="flex flex-col justify-center items-center h-full gap-4">
            <p>No character selected.</p>
            <Link to="/">
                <Button variant="outline">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
                </Button>
            </Link>
        </div>
    );
}
