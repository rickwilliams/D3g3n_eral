import { Button } from "@/components/ui/button";
import {
    ChatBubble,
    ChatBubbleMessage,
    ChatBubbleTimestamp,
} from "@/components/ui/chat/chat-bubble";
import { ChatInput } from "@/components/ui/chat/chat-input";
import { ChatMessageList } from "@/components/ui/chat/chat-message-list";
import { useTransition, animated, type AnimatedProps } from "@react-spring/web";
import { Paperclip, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Content, UUID } from "@elizaos/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { cn, moment } from "@/lib/utils";
import { Avatar, AvatarImage } from "./ui/avatar";
import CopyButton from "./copy-button";
import ChatTtsButton from "./ui/chat/chat-tts-button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import AIWriter from "react-aiwriter";
import type { IAttachment } from "@/types";
import { AudioRecorder } from "./audio-recorder";
import { Badge } from "./ui/badge";
import { useAutoScroll } from "./ui/chat/hooks/useAutoScroll";

type ExtraContentFields = {
    user: string;
    createdAt: number;
    isLoading?: boolean;
};

type ContentWithUser = Content & ExtraContentFields;

type AnimatedDivProps = AnimatedProps<{ style: React.CSSProperties }> & {
    children?: React.ReactNode;
};

export type ChatProps = {
    agentId: UUID;
    isCustomCharacter?: boolean;
};

export default function Page({ agentId, isCustomCharacter = false }: ChatProps) {
    const { toast } = useToast();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [input, setInput] = useState("");
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const formRef = useRef<HTMLFormElement>(null);

    const queryClient = useQueryClient();

    // Use the character object to create a local chat experience if it's provided
    // instead of querying the backend for an agent
    const [customMessages, setCustomMessages] = useState<ContentWithUser[]>([]);
    
    // Get messages from query cache if using an agent, or from local state if using a custom character
    const messages = isCustomCharacter 
        ? customMessages 
        : (agentId ? queryClient.getQueryData<ContentWithUser[]>(["messages", agentId]) || [] : []);

    const getMessageVariant = (role: string) =>
        role !== "user" ? "received" : "sent";

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            formRef.current?.requestSubmit();
        }
    };

    // Handle sending messages
    const handleSendMessage = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const message = input.trim();
        setInput("");

        if (!message && !selectedFile) {
            return;
        }

        if (isCustomCharacter && character) {
            // For custom characters, we'll handle the chat locally
            const userMessage: ContentWithUser = {
                type: "text",
                text: message,
                user: "user",
                createdAt: Date.now(),
            };
            
            // Add the user message
            setCustomMessages((prev) => [...prev, userMessage]);
            
            // Simulate a loading message from the character
            const loadingMessage: ContentWithUser = {
                type: "text",
                text: "",
                user: character.name,
                createdAt: Date.now() + 1,
                isLoading: true,
            };
            
            setCustomMessages((prev) => [...prev, loadingMessage]);
            
            // Simulate a delay before the character responds
            setTimeout(() => {
                // Generate a simple response based on the character's details
                const bio = character.details?.bio?.[0] || "I'm a custom character.";
                
                const responses = [
                    `Hi there! ${bio}`,
                    `Hello! How can I help you today? ${bio}`,
                    `Thanks for your message. ${bio}`,
                    `I'm here to chat with you. ${bio}`,
                    `Nice to meet you! ${bio}`
                ];
                
                const randomResponse = responses[Math.floor(Math.random() * responses.length)];
                
                const characterResponse: ContentWithUser = {
                    type: "text",
                    text: randomResponse,
                    user: character.name,
                    createdAt: Date.now() + 2,
                };
                
                // Replace the loading message with the actual response
                setCustomMessages((prev) => 
                    prev.filter(msg => !msg.isLoading).concat([characterResponse])
                );
            }, 1500);
            
            return;
        }

        if (!agentId) {
            toast({
                title: "Error",
                description: "No agent or character selected",
            });
            return;
        }

        // Add the user's message to the optimistic cache
        const content: ContentWithUser = {
            type: "text",
            text: message,
            user: "user",
            createdAt: Date.now(),
        };

        // Add an attachment if there's a file selected
        if (selectedFile) {
            // This should be a separate API call to upload the file
            // For now, just log it
            console.log("Would upload file:", selectedFile);
        }

        // Update the cache with the new message
        queryClient.setQueryData<ContentWithUser[]>(
            ["messages", agentId],
            (old) => [...(old || []), content]
        );

        // Send the message to the server
        apiClient.sendMessage(agentId, content);

        // Clear the selected file
        setSelectedFile(null);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) {
            return;
        }

        const file = files[0];
        setSelectedFile(file);
    };

    const transitions = useTransition(messages, {
        keys: (message) =>
            `${message.user}-${message.createdAt}-${message.text}`,
        from: { opacity: 0, transform: "translateY(10px)" },
        enter: { opacity: 1, transform: "translateY(0px)" },
        leave: { opacity: 0, transform: "translateY(10px)" },
        config: { tension: 300, friction: 20 },
    });

    const AnimatedDiv = animated.div as React.FC<AnimatedDivProps>;

    // Use the autoScroll hook for the message list
    const { containerRef } = useAutoScroll(messages);

    return (
        <div className="grid h-full">
            <div className="w-full h-full p-4 flex flex-col gap-4 overflow-hidden">
                <div className="relative">
                    <ChatMessageList ref={containerRef}>
                        {transitions((style, msg, _, index) => {
                            const variant = getMessageVariant(msg.user);
                            const isLast =
                                index === messages.length - 1 &&
                                msg.user !== "user";
                            const showTimestamp = true;

                            return (
                                <AnimatedDiv style={style}>
                                    <ChatBubble
                                        variant={variant}
                                        className="my-2 gap-2"
                                    >
                                        {variant === "received" && (
                                            <div className="flex justify-start items-start gap-2">
                                                <Avatar className="h-8 w-8">
                                                    {isCustomCharacter && character?.avatarUrl ? (
                                                        <AvatarImage
                                                            src={character.avatarUrl}
                                                            alt={character.name}
                                                        />
                                                    ) : (
                                                        <div className="h-full w-full grid place-items-center text-xs font-semibold uppercase bg-primary text-primary-foreground">
                                                            {isCustomCharacter 
                                                                ? character?.name?.substring(0, 2) || "CH"
                                                                : "AI"}
                                                        </div>
                                                    )}
                                                </Avatar>
                                                <div className="flex flex-col gap-1">
                                                    <ChatBubbleMessage
                                                        className={
                                                            variant === "received"
                                                                ? "border rounded-md p-3 bg-muted"
                                                                : ""
                                                        }
                                                    >
                                                        {msg.isLoading ? (
                                                            <div className="h-6 flex items-center">
                                                                <AIWriter>
                                                                    Thinking...
                                                                </AIWriter>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                {msg.type ===
                                                                    "text" && (
                                                                    <p
                                                                        className={cn(
                                                                            "whitespace-pre-wrap",
                                                                            variant ===
                                                                                "sent" &&
                                                                                "text-white"
                                                                        )}
                                                                    >
                                                                        {msg.text}
                                                                    </p>
                                                                )}
                                                                {msg.type ===
                                                                    "attachment" &&
                                                                    "attachment" in
                                                                        msg && (
                                                                        <div>
                                                                            <p>
                                                                                Attachment:
                                                                            </p>
                                                                            <Badge>
                                                                                {
                                                                                    (
                                                                                        msg as unknown as {
                                                                                            attachment: IAttachment;
                                                                                        }
                                                                                    )
                                                                                        .attachment
                                                                                        .name
                                                                                }
                                                                            </Badge>
                                                                        </div>
                                                                    )}
                                                            </>
                                                        )}
                                                    </ChatBubbleMessage>
                                                    <div className="flex items-center gap-2">
                                                        {showTimestamp && (
                                                            <ChatBubbleTimestamp>
                                                                {moment(
                                                                    msg.createdAt
                                                                ).format(
                                                                    "h:mm A"
                                                                )}
                                                            </ChatBubbleTimestamp>
                                                        )}
                                                        {!msg.isLoading && msg.text && (
                                                            <>
                                                                <ChatTtsButton
                                                                    text={
                                                                        msg.text
                                                                    }
                                                                />
                                                                <CopyButton
                                                                    value={
                                                                        msg.text
                                                                    }
                                                                />
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {variant === "sent" && (
                                            <div className="flex justify-end items-start gap-2">
                                                <div className="flex flex-col gap-1 items-end">
                                                    <ChatBubbleMessage
                                                        className={
                                                            variant === "sent"
                                                                ? "bg-primary text-primary-foreground p-3 rounded-md w-fit"
                                                                : ""
                                                        }
                                                    >
                                                        <p
                                                            className={cn(
                                                                "whitespace-pre-wrap",
                                                                variant ===
                                                                    "sent" &&
                                                                    "text-white"
                                                            )}
                                                        >
                                                            {msg.text}
                                                        </p>
                                                    </ChatBubbleMessage>
                                                    {showTimestamp && (
                                                        <ChatBubbleTimestamp>
                                                            {moment(
                                                                msg.createdAt
                                                            ).format("h:mm A")}
                                                        </ChatBubbleTimestamp>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </ChatBubble>
                                </AnimatedDiv>
                            );
                        })}
                    </ChatMessageList>
                </div>

                <form
                    ref={formRef}
                    onSubmit={handleSendMessage}
                    className="flex flex-col gap-2 w-full"
                >
                    {selectedFile && (
                        <div className="p-2 rounded-md border flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Paperclip className="h-4 w-4" />
                                <span className="text-sm text-muted-foreground">
                                    {selectedFile.name}
                                </span>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSelectedFile(null)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    )}

                    <div className="flex w-full items-end gap-2">
                        <div className="flex-1">
                            <ChatInput
                                ref={inputRef}
                                value={input}
                                placeholder="Type a message..."
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="flex-shrink-0"
                                        onClick={() =>
                                            fileInputRef.current?.click()
                                        }
                                    >
                                        <Paperclip className="h-4 w-4" />
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            className="hidden"
                                            onChange={handleFileChange}
                                        />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    Upload a file
                                </TooltipContent>
                            </Tooltip>
                            <Button
                                type="submit"
                                size="icon"
                                className="flex-shrink-0"
                                disabled={!input && !selectedFile}
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
