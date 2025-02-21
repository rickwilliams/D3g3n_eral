import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import PageTitle from "@/components/page-title";
import { useToast } from "@/hooks/use-toast";
import { Dropzone } from "@/components/ui/dropzone";
import { apiClient } from "@/lib/api";
import { Separator } from "@/components/ui/separator";

/**
 * Character Generator
 * Creates new AI characters with customizable traits including avatars
 * 
 * Avatar handling:
 * 1. User selects image via drag-drop or click
 * 2. Preview shown immediately using URL.createObjectURL
 * 3. On form submit:
 *    - Image uploaded first
 *    - URL received from server
 *    - URL included in character creation
 */

// Add helper text components
const FieldHelp = ({ children }: { children: React.ReactNode }) => (
    <p className="text-sm text-muted-foreground">{children}</p>
);

export default function CharacterGenerator() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [character, setCharacter] = useState({
        name: "",
        clients: ["direct"],
        avatarUrl: "",
        modelProvider: "openai",
        bio: [] as string[],
        lore: [] as string[],
        adjectives: [] as string[],
        topics: [] as string[],
        people: [] as string[],
        knowledge: [] as string[],
        system: "",
        settings: {
            voice: {
                model: "en_US-female-medium"
            }
        }
    });

    const [previewUrl, setPreviewUrl] = useState<string>();
    const [avatarFile, setAvatarFile] = useState<File>();

    /**
     * Handle file selection from Dropzone
     * Creates temporary preview URL and stores file for upload
     */
    const handleFileSelect = (file: File) => {
        setAvatarFile(file);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        setCharacter(prev => ({
            ...prev,
            avatarUrl: file.name // Temporary - will be replaced with real URL after upload
        }));
    };

    /**
     * Form submission handler
     * Uploads avatar first if present, then creates character
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            let avatarUrl = character.avatarUrl;
            if (avatarFile) {
                try {
                    avatarUrl = await apiClient.uploadFile(avatarFile);
                } catch (error) {
                    toast({
                        title: "Upload Error",
                        description: error instanceof Error ? error.message : "Failed to upload avatar",
                        variant: "destructive"
                    });
                    return;
                }
            }

            // Create character with final avatar URL
            const response = await fetch("/agents", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...character, avatarUrl }),
            });

            if (!response.ok) throw new Error("Failed to create character");

            const data = await response.json();
            toast({
                title: "Success",
                description: "Character created successfully",
            });
            navigate(`/chat/${data.id}`);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to create character",
                variant: "destructive",
            });
        }
    };

    // Helper to handle array field updates
    const handleArrayInput = (field: keyof typeof character) => (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const values = e.target.value.split('\n').filter(line => line.trim() !== '');
        setCharacter(prev => ({
            ...prev,
            [field]: values
        }));
    };

    return (
        <div className="container py-6 space-y-8">
            <PageTitle 
                title="Create Character" 
                subtitle="Design a new AI character with custom traits and behaviors"
            />
            
            <form onSubmit={handleSubmit} className="space-y-6">
                <Tabs defaultValue="basic" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="basic">Basic Info</TabsTrigger>
                        <TabsTrigger value="personality">Personality</TabsTrigger>
                        <TabsTrigger value="settings">Settings</TabsTrigger>
                    </TabsList>

                    <TabsContent value="basic" className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <FieldHelp>The character's display name</FieldHelp>
                            <Input
                                id="name"
                                value={character.name}
                                onChange={(e) => setCharacter({
                                    ...character,
                                    name: e.target.value
                                })}
                                placeholder="Character name"
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <Label>Avatar</Label>
                            <FieldHelp>Upload a profile picture (max 3MB)</FieldHelp>
                            <Dropzone
                                onFileSelect={handleFileSelect}
                                value={previewUrl}
                                className="w-48 h-48"
                            />
                        </div>

                        <Separator className="my-4" />

                        <div className="space-y-2">
                            <Label htmlFor="bio">Bio</Label>
                            <FieldHelp>
                                Short statements about the character's personality and background.
                                Each line will be used as a separate bio entry.
                            </FieldHelp>
                            <Textarea
                                id="bio"
                                value={character.bio.join('\n')}
                                onChange={handleArrayInput('bio')}
                                placeholder="shape rotator nerd with a penchant for breaking into particle accelerators
spends too much time coding her 'goonscript' language
if you can't handle her at her most based, you don't deserve her at her most cringe"
                                className="min-h-[150px] font-mono"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="lore">Lore</Label>
                            <FieldHelp>
                                Deeper background information and story elements.
                                Each line represents a separate piece of lore.
                            </FieldHelp>
                            <Textarea
                                id="lore"
                                value={character.lore.join('\n')}
                                onChange={handleArrayInput('lore')}
                                placeholder="Former researcher at CERN who got banned for unauthorized experiments
Has a secret lab in an abandoned subway station
Believes that reality is just a very complex programming language"
                                className="min-h-[150px] font-mono"
                            />
                        </div>
                    </TabsContent>

                    <TabsContent value="personality" className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="adjectives">Adjectives</Label>
                            <FieldHelp>
                                Words that describe the character's personality traits.
                                One adjective per line.
                            </FieldHelp>
                            <Textarea
                                id="adjectives"
                                value={character.adjectives.join('\n')}
                                onChange={handleArrayInput('adjectives')}
                                placeholder="intelligent
academic
insightful
unhinged
technically specific"
                                className="min-h-[100px] font-mono"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="topics">Topics</Label>
                            <FieldHelp>
                                Subjects the character is knowledgeable about or interested in.
                                One topic per line.
                            </FieldHelp>
                            <Textarea
                                id="topics"
                                value={character.topics.join('\n')}
                                onChange={handleArrayInput('topics')}
                                placeholder="quantum computing
cybersecurity
particle physics
underground electronic music"
                                className="min-h-[100px] font-mono"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="people">People</Label>
                            <FieldHelp>
                                People the character knows or references.
                                One person per line.
                            </FieldHelp>
                            <Textarea
                                id="people"
                                value={character.people.join('\n')}
                                onChange={handleArrayInput('people')}
                                placeholder="Richard Feynman
Ada Lovelace
Satoshi Nakamoto"
                                className="min-h-[100px] font-mono"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="knowledge">Knowledge</Label>
                            <FieldHelp>
                                Specific facts, skills, or information the character possesses.
                                One entry per line.
                            </FieldHelp>
                            <Textarea
                                id="knowledge"
                                value={character.knowledge.join('\n')}
                                onChange={handleArrayInput('knowledge')}
                                placeholder="Expert in quantum cryptography
Fluent in assembly language
Deep knowledge of particle accelerator design"
                                className="min-h-[100px] font-mono"
                            />
                        </div>
                    </TabsContent>

                    <TabsContent value="settings" className="space-y-4">
                        {/* We can add more settings here later */}
                        <div className="space-y-2">
                            <Label htmlFor="system">System Prompt</Label>
                            <Textarea
                                id="system"
                                value={character.system}
                                onChange={(e) => setCharacter({
                                    ...character,
                                    system: e.target.value
                                })}
                                placeholder="Enter system prompt..."
                                className="min-h-[150px]"
                            />
                        </div>
                    </TabsContent>
                </Tabs>

                <div className="flex justify-end gap-4">
                    <Button variant="outline" onClick={() => navigate("/")}>
                        Cancel
                    </Button>
                    <Button type="submit">
                        Create Character
                    </Button>
                </div>
            </form>
        </div>
    );
} 