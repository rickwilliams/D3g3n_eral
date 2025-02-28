import { useParams } from "@tanstack/react-router";
import Chat from "@/components/chat";
import type { UUID } from "@elizaos/core";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function ChatRoute() {
    // Extract the agentId from the route params
    const { agentId } = useParams({ from: "/layout/chat/$agentId" });

    if (!agentId) {
        return (
            <div className="flex flex-col justify-center items-center h-full gap-4">
                <p>No agent selected.</p>
                <Button 
                    variant="outline" 
                    onClick={() => window.history.back()}
                    className="flex items-center gap-2"
                >
                    <ArrowLeft className="h-4 w-4" /> Back
                </Button>
            </div>
        );
    }

    return <Chat agentId={agentId as UUID} />;
}
