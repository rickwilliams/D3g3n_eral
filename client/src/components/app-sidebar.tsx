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
import { NavLink, useLocation, useNavigate } from "react-router";
import type { UUID } from "@elizaos/core";
import { Book, Cog, Plus, Settings, User } from "lucide-react";
import ConnectionStatus from "./connection-status";
import { useAuth, useUser } from "@clerk/clerk-react";
import { Button } from "./ui/button";

export function AppSidebar() {
    const location = useLocation();
    const navigate = useNavigate();
    const { isLoaded, isSignedIn } = useAuth();
    const { user } = useUser();
    
    const query = useQuery({
        queryKey: ["agents"],
        queryFn: () => apiClient.getAgents(),
        refetchInterval: 5_000,
    });

    const agents = query?.data?.agents;

    const handleCreateCharacter = () => {
        if (isSignedIn) {
            navigate("/create-character");
        } else {
            navigate("/sign-in");
        }
    };

    return (
        <Sidebar>
            <SidebarHeader>
                <SidebarMenu>
                    <div className="flex items-center justify-between w-full px-2">
                        <SidebarMenuItem>
                            <SidebarMenuButton size="lg" asChild>
                                <NavLink to="/">
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
                                </NavLink>
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
                                        (_, _index) => (
                                            <SidebarMenuItem key={"skeleton-item-" + _index}>
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
                                                <div className="flex w-full">
                                                    <NavLink
                                                        to={`/chat/${agent.id}`}
                                                        className="flex-1"
                                                    >
                                                        <SidebarMenuButton
                                                            isActive={location.pathname.includes(
                                                                agent.id
                                                            )}
                                                        >
                                                            <User />
                                                            <span>
                                                                {agent.name}
                                                            </span>
                                                        </SidebarMenuButton>
                                                    </NavLink>
                                                    <NavLink to={`/settings/${agent.id}`}>
                                                        <Button variant="ghost" size="icon" className="ml-2">
                                                            <Settings className="size-4" />
                                                        </Button>
                                                    </NavLink>
                                                </div>
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
                        <NavLink
                            to="https://elizaos.github.io/eliza/docs/intro/"
                            target="_blank"
                        >
                            <SidebarMenuButton>
                                <Book /> Documentation
                            </SidebarMenuButton>
                        </NavLink>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        {isLoaded ? (
                            isSignedIn ? (
                                <NavLink to="/profile">
                                    <SidebarMenuButton>
                                        <User /> Profile
                                    </SidebarMenuButton>
                                </NavLink>
                            ) : (
                                <NavLink to="/sign-in">
                                    <SidebarMenuButton>
                                        <User /> Sign In
                                    </SidebarMenuButton>
                                </NavLink>
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
