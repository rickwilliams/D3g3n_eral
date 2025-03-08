import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "@tanstack/react-router";
import { apiClient } from "@/lib/api";
import Overview from "@/components/overview";
import { useToast } from "@/components/ui/use-toast";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useEffect } from "react";
import type { UUID } from "@elizaos/core";

export default function OverviewPage() {
    const { agentId } = useParams({ strict: false });
    const router = useRouter();
    const { toast } = useToast();
    const { isLoaded, isSignedIn } = useAuth();
    const { user } = useUser();

    const query = useQuery({
        queryKey: ["agent", agentId],
        queryFn: () => apiClient.getAgent(agentId ?? ""),
        refetchInterval: 5000,
        enabled: !!agentId && isSignedIn,
    });

    // Check if the user is the owner of this character
    useEffect(() => {
        if (isLoaded && !isSignedIn) {
            toast({
                title: "Authentication required",
                description: "Please sign in to view character settings",
                variant: "destructive",
            });
            router.navigate({ to: "/sign-in" });
        } else if (query.data && user) {
            // Access character details and check if user_id matches
            const character = query.data.character;
            // @ts-ignore - user_id might be in character.details
            const characterUserId = character?.details?.user_id;
            
            if (characterUserId && characterUserId !== user.id) {
                toast({
                    title: "Unauthorized",
                    description: "You can only view settings for your own characters",
                    variant: "destructive",
                });
                router.navigate({ to: "/" });
            }
        }
    }, [isLoaded, isSignedIn, router, toast, query.data, user]);

    if (!isLoaded || !isSignedIn) {
        return <div className="p-8 flex justify-center">Loading authentication...</div>;
    }

    if (query.isPending) {
        return <div className="p-8 flex justify-center">Loading character data...</div>;
    }

    if (query.isError) {
        return <div className="p-8 text-destructive">Error: Unable to load character data</div>;
    }

    return <Overview character={query.data?.character} />;
}
