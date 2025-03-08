import { useParams, useRouter } from "@tanstack/react-router";
import Chat from "@/components/chat";
import type { UUID, Character } from "@elizaos/core";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useToast } from "@/components/ui/use-toast";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";

// List of default characters that anyone can chat with
const DEFAULT_CHARACTERS = ["Snoop", "D3g3n_eral"]; 

export default function ChatRoute() {
    const { agentId } = useParams({ strict: false });
    const router = useRouter();
    const { toast } = useToast();
    const { isLoaded, isSignedIn } = useAuth();
    const { user } = useUser();
    const [isDefaultCharacter, setIsDefaultCharacter] = useState(false);
    
    // Check if this is a default character anyone can chat with
    const agentQuery = useQuery({
        queryKey: ["agent", agentId],
        queryFn: () => apiClient.getAgent(agentId ?? ""),
        enabled: !!agentId
    });

    // Check if this is a default character when data loads
    useEffect(() => {
        if (agentQuery.data) {
            const characterName = agentQuery.data?.character?.name;
            if (characterName && DEFAULT_CHARACTERS.includes(characterName)) {
                setIsDefaultCharacter(true);
            }
        }
    }, [agentQuery.data]);

    // Check for authentication
    useEffect(() => {
        if (isLoaded && !isSignedIn && !isDefaultCharacter) {
            toast({
                title: "Authentication required",
                description: "Please sign in to chat with this agent",
                variant: "destructive",
            });
            router.navigate({ to: "/sign-in" });
        }
    }, [isLoaded, isSignedIn, router, toast, isDefaultCharacter]);

    if (!agentId) {
        return <div className="p-8 text-destructive">No agent selected</div>;
    }

    // If this is a default character or user is authenticated, show the chat
    if (isDefaultCharacter || isSignedIn || !isLoaded) {
        return <Chat agentId={agentId} />;
    }

    return <div className="p-8 flex justify-center">Authentication required to chat with this agent.</div>;
}
