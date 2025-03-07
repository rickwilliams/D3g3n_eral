import { useParams } from "@tanstack/react-router";
import Chat from "@/components/chat";
import type { UUID } from "@elizaos/core";

export default function AgentRoute() {
    const { agentId } = useParams({ from: "/layout/chat/$agentId" });

    if (!agentId) return <div>No data.</div>;

    return <Chat agentId={agentId} />;
}
