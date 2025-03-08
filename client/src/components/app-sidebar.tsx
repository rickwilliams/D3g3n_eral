import { useQuery } from "@tanstack/react-query";
import info from "@/lib/info.json";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSkeleton,
} from "@/components/ui/sidebar";
import { apiClient } from "@/lib/api";
import { Link, useRouter } from "@tanstack/react-router";
import type { UUID } from "@elizaos/core";
import { Book, Cog, Plus, User } from "lucide-react";
import ConnectionStatus from "./connection-status";
import { Button } from "./ui/button";
import { useAuth } from "@clerk/clerk-react";

export function AppSidebar() {
    const router = useRouter();
    const { isLoaded, isSignedIn, signOut } = useAuth();
    
    const query = useQuery({
        queryKey: ["agents"],
        queryFn: () => apiClient.getAgents(),
        refetchInterval: 5_000,
    });

    const agents = query?.data?.agents;

    const handleCreateCharacter = () => {
        router.navigate({ to: "/create-character" });
    };

    const handleSignOut = async () => {
        await signOut();
        router.navigate({ to: "/" });
    };

    return (
        <Sidebar>
            <SidebarHeader>
                <SidebarMenu>
                    <div className="flex items-center justify-between w-full px-2">
                        <SidebarMenuItem>
                            <SidebarMenuButton size="lg" asChild>
                                <Link to="/">
                                    <img
                                        alt="elizaos-icon"
                                        src="/elizaos-icon.png"
                                        width="100%"
                                        height="100%"
                                        className="size-7"
                                    />

                                    <div className="flex flex-col gap-0.5 leading-none">
                                        <span className="font-semibold">
                                            ElizaOS
                                        </span>
                                        <span className="">v{info?.version}</span>
                                    </div>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="ml-auto"
                            onClick={handleCreateCharacter}
                            title="Create new character"
                        >
                            <Plus className="size-5" />
                        </Button>
                    </div>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Agents</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {query?.isPending ? (
                                <div>
                                    {Array.from({ length: 5 }).map(
                                        (_, index) => (
                                            <SidebarMenuItem key={`skeleton-item-${index}`}>
                                                <SidebarMenuSkeleton />
                                            </SidebarMenuItem>
                                        )
                                    )}
                                </div>
                            ) : (
                                <div>
                                    {agents?.map(
                                        (agent: { id: UUID; name: string }) => (
                                            <SidebarMenuItem key={agent.id}>
                                                <Link
                                                    to="/chat/$agentId"
                                                    params={{ agentId: agent.id }}
                                                >
                                                    <SidebarMenuButton
                                                        isActive={router.state.location.pathname.includes(
                                                            agent.id
                                                        )}
                                                    >
                                                        <User />
                                                        <span>
                                                            {agent.name}
                                                        </span>
                                                    </SidebarMenuButton>
                                                </Link>
                                            </SidebarMenuItem>
                                        )
                                    )}
                                </div>
                            )}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <a
                            href="https://elizaos.github.io/eliza/docs/intro/"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <SidebarMenuButton>
                                <Book /> Documentation
                            </SidebarMenuButton>
                        </a>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        {isLoaded ? (
                            isSignedIn ? (
                                <SidebarMenuButton onClick={handleSignOut}>
                                    <User /> Sign Out
                                </SidebarMenuButton>
                            ) : (
                                <Link 
                                    to="/sign-in" 
                                >
                                    <SidebarMenuButton>
                                        <User /> Sign In
                                    </SidebarMenuButton>
                                </Link>
                            )
                        ) : (
                            <SidebarMenuButton disabled>
                                <User /> Loading...
                            </SidebarMenuButton>
                        )}
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton disabled>
                            <Cog /> Settings
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <ConnectionStatus />
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}
