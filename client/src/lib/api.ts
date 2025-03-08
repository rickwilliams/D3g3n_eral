import type { UUID, Character } from "@elizaos/core";
import { getUserToken, createSupabaseClient } from "./supabase-client";
import { v4 as uuidv4 } from 'uuid';
// Import the character API functions to redirect calls
import { 
    getCharacters, 
    getCharacter, 
    createCharacter, 
    updateCharacter, 
    deleteCharacter 
} from './character-api';

const BASE_URL =
    import.meta.env.VITE_SERVER_BASE_URL ||
    `${import.meta.env.VITE_SERVER_URL}:${import.meta.env.VITE_SERVER_PORT}`;

// Remove USER_MANAGEMENT_API_URL as it's no longer needed
console.log({ BASE_URL });

const fetcher = async ({
    url,
    method,
    body,
    headers,
}: {
    url: string;
    method?: "GET" | "POST";
    body?: object | FormData;
    headers?: HeadersInit;
}) => {
    const options: RequestInit = {
        method: method ?? "GET",
        headers: headers
            ? headers
            : {
                  Accept: "application/json",
                  "Content-Type": "application/json",
              },
    };

    if (method === "POST") {
        if (body instanceof FormData) {
            if (options.headers && typeof options.headers === "object") {
                // Create new headers object without Content-Type
                options.headers = Object.fromEntries(
                    Object.entries(
                        options.headers as Record<string, string>
                    ).filter(([key]) => key !== "Content-Type")
                );
            }
            options.body = body;
        } else {
            options.body = JSON.stringify(body);
        }
    }

    try {
        console.log(`API Request: ${method || 'GET'} ${BASE_URL}${url}`);
        const response = await fetch(`${BASE_URL}${url}`, options);
        const contentType = response.headers.get("Content-Type");
        
        if (contentType === "audio/mpeg") {
            return await response.blob();
        }

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`API Error (${response.status}): ${errorText}`);

            let errorMessage = `API Error (${response.status})`;
            try {
                const errorObj = JSON.parse(errorText);
                errorMessage = errorObj.message || errorMessage;
            } catch {
                errorMessage = errorText || errorMessage;
            }

            throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log(`API Response: ${url}`, data);
        return data;
    } catch (error) {
        console.error(`API Request Failed: ${url}`, error);
        throw error;
    }
};

// Helper function to get headers with authentication
const getAuthHeaders = async () => {
    const token = await getUserToken();
    const userId = localStorage.getItem('userId') || '';
    
    return {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'x-user-id': userId,
        'Authorization': token ? `Bearer ${token}` : ''
    };
};

export const apiClient = {
    sendMessage: (
        agentId: string,
        message: string,
        selectedFile?: File | null
    ) => {
        const formData = new FormData();
        formData.append("text", message);
        formData.append("user", "user");

        if (selectedFile) {
            formData.append("file", selectedFile);
        }
        return fetcher({
            url: `/${agentId}/message`,
            method: "POST",
            body: formData,
        });
    },
    getAgents: async () => {
        try {
            console.log("Fetching agents from API...");
            const result = await fetcher({ url: "/agents" });
            console.log("Agents API response:", result);
            
            // Ensure agents array is always available, even if empty
            if (!result.agents) {
                console.warn("No agents array in API response, returning empty array");
                return { agents: [] };
            }
            
            // Log each agent with user_id for debugging
            result.agents.forEach((agent: any) => {
                console.log(`Fetched agent: ${agent.name} (${agent.id}), user_id: ${agent.user_id}`);
            });
            
            return result;
        } catch (error) {
            console.error("Error fetching agents:", error);
            
            // Retry once after a short delay in case of temporary network issues
            try {
                console.log("Retrying agents fetch after error...");
                await new Promise(resolve => setTimeout(resolve, 1000));
                const retryResult = await fetcher({ url: "/agents" });
                
                if (!retryResult.agents) {
                    return { agents: [] };
                }
                
                return retryResult;
            } catch (retryError) {
                console.error("Retry also failed:", retryError);
                // Return empty array on error to prevent UI crashes
                return { agents: [] };
            }
        }
    },
    getUserCharacters: async () => {
        console.log("Redirecting to character-api.getCharacters()");
        return await getCharacters();
    },
    getUserCharacter: async (characterId: string) => {
        console.log(`Redirecting to character-api.getCharacter(${characterId})`);
        return await getCharacter(characterId);
    },
    createUserCharacter: async (characterData: any) => {
        console.log("Redirecting to character-api.createCharacter()");
        return await createCharacter(characterData);
    },
    updateUserCharacter: async (characterId: string, characterData: any) => {
        console.log(`Redirecting to character-api.updateCharacter(${characterId})`);
        const success = await updateCharacter(characterId, characterData);
        return success ? { success: true } : { success: false, error: "Failed to update character" };
    },
    deleteUserCharacter: async (characterId: string) => {
        console.log(`Redirecting to character-api.deleteCharacter(${characterId})`);
        const success = await deleteCharacter(characterId);
        return success ? { success: true } : { success: false, error: "Failed to delete character" };
    },
    getAgent: (agentId: string): Promise<{ id: UUID; character: Character }> =>
        fetcher({ url: `/agents/${agentId}` }),
    tts: (agentId: string, text: string) =>
        fetcher({
            url: `/${agentId}/tts`,
            method: "POST",
            body: {
                text,
            },
            headers: {
                "Content-Type": "application/json",
                Accept: "audio/mpeg",
                "Transfer-Encoding": "chunked",
            },
        }),
    whisper: async (agentId: string, audioBlob: Blob) => {
        const formData = new FormData();
        formData.append("file", audioBlob, "recording.wav");
        return fetcher({
            url: `/${agentId}/whisper`,
            method: "POST",
            body: formData,
        });
    },
};
