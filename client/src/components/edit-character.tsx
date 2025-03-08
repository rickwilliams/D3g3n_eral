import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth, useUser } from "@clerk/clerk-react";
import { createSupabaseClient, setupTokenRetrieval } from "@/lib/supabase-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { uploadToS3 } from "@/lib/s3";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { RefreshIcon } from "@/components/icons/refresh";
import { updateCharacter, deleteCharacter } from '../lib/character-api';

// UI Components
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FileUpload } from "@/components/ui/file-upload";
import { MultiSelect, Option } from "@/components/ui/multi-select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

// Define schema for the form validation
const characterFormSchema = z.object({
  name: z.string().min(1, "Character name is required"),
  bio: z.string().min(1, "Character bio is required"),
  lore: z.string().optional(),
  style: z.object({
    all: z.array(z.string()),
    chat: z.array(z.string()),
    post: z.array(z.string())
  }),
  topics: z.array(z.string()),
  adjectives: z.array(z.string()),
  avatarUrl: z.string().optional(),
  clients: z.array(z.string()),
  plugins: z.array(z.string()),
  // Knowledge files will be handled separately
  knowledge: z.array(z.string()).default([]),
  templates: z.record(z.string()).default({}),
});

type CharacterFormValues = z.infer<typeof characterFormSchema>;

// Sample data for dropdowns
const topicOptions: Option[] = [
  { label: "Technology", value: "technology" },
  { label: "Philosophy", value: "philosophy" },
  { label: "Art", value: "art" },
  { label: "Science", value: "science" },
  { label: "Literature", value: "literature" },
  { label: "Psychology", value: "psychology" },
  { label: "Mythology", value: "mythology" },
  { label: "Quantum Physics", value: "quantum physics" },
  { label: "Computer Science", value: "computer science" },
  { label: "Mathematics", value: "mathematics" },
];

const adjectiveOptions: Option[] = [
  { label: "Intelligent", value: "intelligent" },
  { label: "Curious", value: "curious" },
  { label: "Thoughtful", value: "thoughtful" },
  { label: "Creative", value: "creative" },
  { label: "Analytical", value: "analytical" },
  { label: "Calm", value: "calm" },
  { label: "Energetic", value: "energetic" },
  { label: "Funny", value: "funny" },
  { label: "Serious", value: "serious" },
  { label: "Empathetic", value: "empathetic" },
];

// Complete list of clients based on elizaOS registry
const clientOptions: Option[] = [
  { label: "Direct", value: "direct", description: "Direct interaction with users via chat interface" },
  { label: "Auto", value: "auto", description: "Automated responses to user queries" },
  { label: "Twitter/X", value: "twitter", description: "Twitter/X social media integration" },
  { label: "Discord", value: "discord", description: "Discord bot integration" },
  { label: "Telegram", value: "telegram", description: "Telegram messaging integration" },
  { label: "Slack", value: "slack", description: "Slack workspace integration" },
  { label: "WhatsApp", value: "whatsapp", description: "WhatsApp messaging integration" },
  { label: "Farcaster", value: "farcaster", description: "Web3 social networking integration" },
  { label: "GitHub", value: "github", description: "GitHub integration for repositories and issues" },
  { label: "Lens", value: "lens", description: "Client for Lens Protocol social networking" },
];

// Complete list of plugins based on elizaOS registry
const pluginOptions: Option[] = [
  { label: "Web Search", value: "web-search", description: "Enable web search capabilities" },
  { label: "Image Generation", value: "image-generation", description: "Allow the character to generate images" },
  { label: "Video Generation", value: "video-generation", description: "Video generation using prompts" },
  { label: "PDF Processing", value: "pdf", description: "Enable PDF document processing" },
  { label: "Browser", value: "browser", description: "Web scraping and browser capabilities" },
  { label: "LLaMA", value: "llama", description: "Local LLaMA model integration" },
  { label: "Solana", value: "solana", description: "Solana blockchain integration" },
  { label: "Bootstrap", value: "bootstrap", description: "Basic initialization and setup functionality" },
  { label: "NFT Generation", value: "nft-generation", description: "NFT creation and verification" },
  { label: "Text-to-Speech", value: "tts", description: "AI-powered text-to-speech generation" },
  { label: "OpenWeather", value: "open-weather", description: "Access to weather data and forecasts" },
  { label: "GitBook", value: "gitbook", description: "Query GitBook documentation" },
  { label: "Obsidian", value: "obsidian", description: "Integration with Obsidian vaults for notes" },
  { label: "3D Generation", value: "3d-generation", description: "Generate 3D objects based on text prompts" },
];

// Complete list of available templates
const templateOptions = [
  { label: "Goal Template", value: "goalTemplate", description: "Define the character's overarching purpose and mission" },
  { label: "Objectives Template", value: "objectivesTemplate", description: "Set specific objectives and tasks for the character" },
  { label: "System Prompt", value: "systemPrompt", description: "Define the base system prompt for the character" },
  { label: "Persona Template", value: "personaTemplate", description: "Detailed definition of the character's personality" },
  { label: "Knowledge Base", value: "knowledgeBase", description: "Structure and organize the character's knowledge" },
  { label: "Interaction Style", value: "interactionStyle", description: "Define how the character interacts with users" },
  { label: "Decision Framework", value: "decisionFramework", description: "Rules for how the character makes decisions" },
  { label: "Memory Management", value: "memoryManagement", description: "Configure how the character stores and recalls information" },
];

interface EditCharacterFormProps {
  character: any; // The character to edit
  onSuccess?: () => void;
}

export function EditCharacterForm({ 
  character,
  onSuccess 
}: EditCharacterFormProps) {
  const navigate = useNavigate();
  const { isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState("character");
  const [knowledgeFiles, setKnowledgeFiles] = useState<File[]>([]);
  const [templateEditMode, setTemplateEditMode] = useState<string | null>(null);
  const [templateContent, setTemplateContent] = useState<string>("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isBlobValid, setIsBlobValid] = useState<boolean>(true);
  
  // Format bio and lore arrays to strings for the form
  const bioString = Array.isArray(character.details?.bio) 
    ? character.details.bio.join('\n') 
    : character.details?.bio || "";
    
  const loreString = Array.isArray(character.details?.lore) 
    ? character.details.lore.join('\n') 
    : character.details?.lore || "";
  
  // Initialize form with character data
  const form = useForm<CharacterFormValues>({
    resolver: zodResolver(characterFormSchema),
    defaultValues: {
      name: character.name || "",
      bio: bioString,
      lore: loreString,
      style: {
        all: character.details?.style?.all || ["uses plain english", "friendly and helpful"],
        chat: character.details?.style?.chat || ["conversational", "engaging"],
        post: character.details?.style?.post || ["concise", "informative"]
      },
      topics: character.details?.topics || [],
      adjectives: character.details?.adjectives || ["intelligent", "curious", "thoughtful"],
      avatarUrl: character.avatarUrl && character.avatarUrl.startsWith('blob:') ? "" : character.avatarUrl || "",
      clients: character.details?.clients || ["direct", "auto"],
      plugins: character.details?.plugins || [],
      knowledge: character.details?.knowledge || [],
      templates: character.details?.templates || {},
    },
  });

  // Set up token retrieval when the component mounts
  const setupAuth = useCallback(() => {
    if (isSignedIn && getToken) {
      setupTokenRetrieval(getToken, isSignedIn);
    }
  }, [isSignedIn, getToken]);

  // Clean up blob URLs when component unmounts
  useEffect(() => {
    // Check if avatar URL is a blob URL on component mount
    const checkBlobValidity = async () => {
      if (character.avatarUrl && character.avatarUrl.startsWith('blob:')) {
        console.log('Detected blob URL in character avatar - marking as potentially invalid');
        // Always assume blob URLs are potentially invalid rather than trying to fetch them
        // This prevents unnecessary network requests that might fail
        setIsBlobValid(false);
      } else {
        // Only regular URLs are considered valid
        setIsBlobValid(true);
      }
    };
    
    // Run the check
    checkBlobValidity();
    
    // Cleanup function to revoke any blob URLs when component unmounts
    return () => {
      if (character.avatarUrl && character.avatarUrl.startsWith('blob:')) {
        try {
          console.log('Cleanup: Revoking blob URL on unmount');
          URL.revokeObjectURL(character.avatarUrl);
        } catch (e) {
          console.warn('Non-critical: Could not revoke blob URL on unmount', e);
        }
      }
    };
  }, [character.avatarUrl]);

  useEffect(() => {
    setupAuth();
  }, [setupAuth]);

  const handleSubmit = async (values: any) => {
    setIsSubmitting(true);
    
    try {
      // Process avatar if needed
      let avatarUrl = values.avatarUrl;
      if (avatarFile) {
        try {
          toast({
            title: "Uploading avatar",
            description: "Please wait while we upload your avatar image..."
          });
          
          avatarUrl = await uploadToS3(avatarFile, 'avatars');
          
          toast({
            title: "Avatar uploaded",
            description: "Your avatar has been successfully uploaded to S3."
          });
        } catch (uploadError) {
          console.error('Error uploading avatar file to S3:', uploadError);
          toast({
            title: "Avatar upload failed",
            description: "We couldn't upload your avatar. Using default avatar instead.",
            variant: "destructive"
          });
        }
      }
      
      // Format the character data
      const characterData = {
        name: values.name,
        bio: Array.isArray(values.bio) ? values.bio : values.bio.split('\n').filter((line: string) => line.trim() !== ''),
        lore: values.lore ? (Array.isArray(values.lore) ? values.lore : values.lore.split('\n').filter((line: string) => line.trim() !== '')) : [],
        style: {
          all: Array.isArray(values.style.all) ? values.style.all : values.style.all.split('\n').filter((line: string) => line.trim() !== ''),
          chat: Array.isArray(values.style.chat) ? values.style.chat : values.style.chat.split('\n').filter((line: string) => line.trim() !== ''),
          post: Array.isArray(values.style.post) ? values.style.post : values.style.post.split('\n').filter((line: string) => line.trim() !== '')
        },
        topics: values.topics ? (Array.isArray(values.topics) ? values.topics : values.topics.split('\n').filter((line: string) => line.trim() !== '')) : [],
        adjectives: values.adjectives ? (Array.isArray(values.adjectives) ? values.adjectives : values.adjectives.split('\n').filter((line: string) => line.trim() !== '')) : [],
        avatarUrl,
        clients: values.clients || ['direct', 'auto'],
        plugins: values.plugins || [],
        knowledge: values.knowledge ? (Array.isArray(values.knowledge) ? values.knowledge : values.knowledge.split('\n').filter((line: string) => line.trim() !== '')) : [],
        templates: values.templates || {},
        modelProvider: "openai",
        settings: {
          ragKnowledge: false,
          voice: {
            model: "en_US-female-medium"
          },
          imageSettings: {
            steps: 20,
            width: 1024,
            height: 1024,
            modelId: "FLUX.1-dev",
            modelProvider: "heurist"
          }
        }
      };
      
      const success = await updateCharacter(character.id, characterData);
      
      if (success) {
        toast({
          title: "Character updated",
          description: `Successfully updated character: ${values.name}`,
        });
        
        // Invalidate character queries to refresh the list
        queryClient.invalidateQueries({ queryKey: ["userCharacters"] });
        
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast({
          title: "Error updating character",
          description: "Failed to update character. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error in form submission:', error);
      toast({
        title: "Error updating character",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteCharacter = async () => {
    setIsDeleting(true);
    
    try {
      const success = await deleteCharacter(character.id);
      
      if (success) {
        toast({
          title: "Character deleted",
          description: `Successfully deleted character: ${character.name}`,
        });
        
        // Invalidate character queries to refresh the list
        queryClient.invalidateQueries({ queryKey: ["userCharacters"] });
        
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast({
          title: "Error deleting character",
          description: "Failed to delete character. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting character:', error);
      toast({
        title: "Error deleting character",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfigureTemplate = (templateId: string) => {
    const content = form.getValues().templates[templateId] || getDefaultTemplateContent(templateId);
    setTemplateContent(content);
    setTemplateEditMode(templateId);
  };
  
  const saveTemplateContent = () => {
    if (templateEditMode) {
      form.setValue(`templates.${templateEditMode}`, templateContent);
      setTemplateEditMode(null);
      setTemplateContent("");
    }
  };
  
  const getTemplateName = (templateId: string): string => {
    const template = templateOptions.find(t => t.value === templateId);
    return template ? template.label : templateId;
  };
  
  const getDefaultTemplateContent = (templateId: string): string => {
    // Default content for templates
    const defaults: Record<string, string> = {
      systemPrompt: `You are a helpful AI assistant named ${form.getValues().name || "Character"}.`,
      goalTemplate: "My primary goal is to be helpful and informative.",
      objectivesTemplate: "1. Respond to user queries accurately\n2. Provide useful information\n3. Maintain a consistent persona",
      personaTemplate: `I am ${form.getValues().name || "Character"}, a helpful AI assistant.`,
      // Add defaults for other templates as needed
    };
    
    return defaults[templateId] || "";
  };

  const renderCharacterTab = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }: { field: any }) => (
            <FormItem>
              <FormLabel>Character Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., D3g3n_eral" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="avatarUrl"
          render={({ field }: { field: any }) => (
            <FileUpload
              label="Avatar"
              description="Upload an image or provide a URL"
              value={isBlobValid ? field.value : ''}
              onChange={(url: string) => {
                field.onChange(url);
                setIsBlobValid(true); // Reset validity when value changes
              }}
              onFileChange={(file: File) => {
                setAvatarFile(file);
                setIsBlobValid(true); // Reset validity when file changes
              }}
              accept="image/*"
            />
          )}
        />
        
        <FormField
          control={form.control}
          name="bio"
          render={({ field }: { field: any }) => (
            <FormItem>
              <FormLabel>Character Bio</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe your character's traits and personality. Each line will be treated as a separate trait."
                  rows={6}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Enter each trait on a new line. These define your character's personality.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="lore"
          render={({ field }: { field: any }) => (
            <FormItem>
              <FormLabel>Character Lore (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add background stories and interesting facts about your character. Each line will be treated as a separate piece of lore."
                  rows={6}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Enter each piece of lore on a new line. These add depth to your character's backstory.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="border rounded-lg p-4 space-y-4">
          <h3 className="text-lg font-medium">Style Configuration</h3>
          <p className="text-sm text-muted-foreground">
            Define how your character communicates in different contexts.
          </p>
          
          <FormField
            control={form.control}
            name="style.all"
            render={({ field }) => (
              <FormItem>
                <FormLabel>General Style (applies to all contexts)</FormLabel>
                <FormControl>
                  <MultiSelect
                    options={[
                      { label: "uses plain english", value: "uses plain english" },
                      { label: "friendly and helpful", value: "friendly and helpful" },
                      { label: "formal", value: "formal" },
                      { label: "casual", value: "casual" },
                      { label: "technical", value: "technical" },
                    ]}
                    selected={field.value}
                    onChange={field.onChange}
                    allowUserInput={true}
                    placeholder="Select or enter style traits..."
                  />
                </FormControl>
                <FormDescription>
                  These style traits apply in all communication contexts
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="style.chat"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Chat Style</FormLabel>
                <FormControl>
                  <MultiSelect
                    options={[
                      { label: "conversational", value: "conversational" },
                      { label: "engaging", value: "engaging" },
                      { label: "brief", value: "brief" },
                      { label: "detailed", value: "detailed" },
                      { label: "inquisitive", value: "inquisitive" },
                    ]}
                    selected={field.value}
                    onChange={field.onChange}
                    allowUserInput={true}
                    placeholder="Select or enter chat style traits..."
                  />
                </FormControl>
                <FormDescription>
                  These style traits apply specifically in chat/conversation contexts
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="style.post"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Post Style</FormLabel>
                <FormControl>
                  <MultiSelect
                    options={[
                      { label: "concise", value: "concise" },
                      { label: "informative", value: "informative" },
                      { label: "persuasive", value: "persuasive" },
                      { label: "academic", value: "academic" },
                      { label: "authoritative", value: "authoritative" },
                    ]}
                    selected={field.value}
                    onChange={field.onChange}
                    allowUserInput={true}
                    placeholder="Select or enter post style traits..."
                  />
                </FormControl>
                <FormDescription>
                  These style traits apply specifically in content posting contexts
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="topics"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Topics of Interest</FormLabel>
              <FormControl>
                <MultiSelect
                  options={topicOptions}
                  selected={field.value}
                  onChange={field.onChange}
                  allowUserInput={true}
                  placeholder="Select or enter topics..."
                />
              </FormControl>
              <FormDescription>
                Topics your character is knowledgeable about or interested in
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="adjectives"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Character Adjectives</FormLabel>
              <FormControl>
                <MultiSelect
                  options={adjectiveOptions}
                  selected={field.value}
                  onChange={field.onChange}
                  allowUserInput={true}
                  placeholder="Select or enter adjectives..."
                />
              </FormControl>
              <FormDescription>
                Words that describe your character's personality
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="border rounded-lg p-4 space-y-4">
          <h3 className="text-lg font-medium">Knowledge Base</h3>
          <p className="text-sm text-muted-foreground">
            Upload files that will serve as your character's knowledge base
          </p>
          
          <div className="border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center gap-2">
            <input
              id="knowledge-file-upload"
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  setKnowledgeFiles(prev => [...prev, ...Array.from(e.target.files || [])]);
                }
              }}
            />
            <label htmlFor="knowledge-file-upload" className="cursor-pointer text-center">
              <div className="mb-2">Drag & drop files here, or click to select files</div>
              <Button variant="outline" type="button">
                Upload Files
              </Button>
            </label>
            <div className="text-sm text-muted-foreground mt-2">
              PDFs, text files, and other documents up to 10MB each
            </div>
          </div>
          
          {/* Display existing knowledge files */}
          {character.details?.knowledge && character.details.knowledge.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Existing Knowledge Files</h4>
              <ul className="space-y-2">
                {character.details.knowledge.map((fileUrl: string, index: number) => {
                  const fileName = fileUrl.split('/').pop() || `File ${index + 1}`;
                  return (
                    <li key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="truncate max-w-[200px]">{fileName}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const updatedKnowledge = [...form.getValues().knowledge];
                          updatedKnowledge.splice(index, 1);
                          form.setValue('knowledge', updatedKnowledge);
                        }}
                      >
                        Remove
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          
          {/* Display newly added files */}
          {knowledgeFiles.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Files to Upload</h4>
              <ul className="space-y-2">
                {knowledgeFiles.map((file, index) => (
                  <li key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="truncate max-w-[200px]">{file.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const updatedFiles = [...knowledgeFiles];
                        updatedFiles.splice(index, 1);
                        setKnowledgeFiles(updatedFiles);
                      }}
                    >
                      Remove
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="text-sm text-muted-foreground">
            Note: Files will be uploaded when you save the character
          </div>
        </div>
      </div>
    </div>
  );
  
  const renderClientsTab = () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground mb-4">
        Select which clients your character will be active on. Characters can be active on multiple platforms.
      </p>
      
      <FormField
        control={form.control}
        name="clients"
        render={({ field }) => (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clientOptions.map(client => (
              <div
                key={client.value}
                className={`border rounded-lg p-4 cursor-pointer transition-colors
                  ${field.value.includes(client.value) ? 'bg-primary/10 border-primary' : 'bg-card hover:bg-muted/50'}
                `}
                onClick={() => {
                  const updatedClients = field.value.includes(client.value)
                    ? field.value.filter((c: string) => c !== client.value)
                    : [...field.value, client.value];
                  field.onChange(updatedClients);
                }}
              >
                <div className="flex items-start gap-3">
                  <Checkbox 
                    checked={field.value.includes(client.value)}
                    onCheckedChange={() => {}}
                  />
                  <div>
                    <h3 className="font-medium">{client.label}</h3>
                    <p className="text-sm text-muted-foreground">{getClientDescription(client.value)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      />
    </div>
  );
  
  const renderPluginsTab = () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground mb-4">
        Enable plugins to enhance your character's capabilities. Each plugin adds specific functionality.
      </p>
      
      <FormField
        control={form.control}
        name="plugins"
        render={({ field }) => (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pluginOptions.map(plugin => (
              <div
                key={plugin.value}
                className={`border rounded-lg p-4 cursor-pointer transition-colors
                  ${field.value.includes(plugin.value) ? 'bg-primary/10 border-primary' : 'bg-card hover:bg-muted/50'}
                `}
                onClick={() => {
                  const updatedPlugins = field.value.includes(plugin.value)
                    ? field.value.filter((p: string) => p !== plugin.value)
                    : [...field.value, plugin.value];
                  field.onChange(updatedPlugins);
                }}
              >
                <div className="flex items-start gap-3">
                  <Checkbox 
                    checked={field.value.includes(plugin.value)}
                    onCheckedChange={() => {}}
                  />
                  <div>
                    <h3 className="font-medium">{plugin.label}</h3>
                    <p className="text-sm text-muted-foreground">{getPluginDescription(plugin.value)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      />
    </div>
  );
  
  const renderTemplatesTab = () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground mb-4">
        Configure templates to customize how your character behaves and responds.
      </p>
      
      {templateEditMode ? (
        <div className="border rounded-lg p-4 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">{getTemplateName(templateEditMode)}</h3>
            <Button onClick={saveTemplateContent} size="sm">Save</Button>
          </div>
          
          <Textarea
            value={templateContent}
            onChange={(e) => setTemplateContent(e.target.value)}
            placeholder="Enter template content..."
            rows={12}
            className="font-mono"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templateOptions.map(template => {
            const isConfigured = form.getValues().templates[template.value];
            
            return (
              <div 
                key={template.value}
                className="border rounded-lg p-4 transition-colors hover:bg-muted/50"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium">{template.label}</h3>
                  <Button 
                    onClick={() => handleConfigureTemplate(template.value)}
                    size="sm"
                    variant="outline"
                  >
                    {isConfigured ? "Edit" : "Configure"}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{template.description}</p>
                {isConfigured && (
                  <div className="text-xs bg-muted p-2 rounded max-h-20 overflow-y-auto">
                    <div className="font-mono whitespace-pre-wrap">
                      {form.getValues().templates[template.value].substring(0, 150)}
                      {form.getValues().templates[template.value].length > 150 ? '...' : ''}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
  
  function getClientDescription(clientId: string): string {
    const client = clientOptions.find(c => c.value === clientId);
    if (client) {
      return client.description || `Integration with ${client.label}`;
    }
    return "Platform integration";
  }
  
  function getPluginDescription(pluginId: string): string {
    const plugin = pluginOptions.find(p => p.value === pluginId);
    if (plugin) {
      return plugin.description || `Enables ${plugin.label} functionality`;
    }
    return "Additional functionality";
  }
  
  const handleTabChange = (value: string) => {
    // Check if we're in template edit mode
    if (templateEditMode && value !== "templates") {
      const confirmLeave = window.confirm("You have unsaved changes. Do you want to continue?");
      if (!confirmLeave) {
        return;
      }
      setTemplateEditMode(null);
      setTemplateContent("");
    }
    
    setActiveTab(value);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle>Edit Character: {character.name}</CardTitle>
        <CardDescription>
          Update your character's details
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form id="character-form" onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <div className="flex justify-between items-center mb-6">
                <TabsList>
                  <TabsTrigger value="character">Character</TabsTrigger>
                  <TabsTrigger value="clients">Clients</TabsTrigger>
                  <TabsTrigger value="plugins">Plugins</TabsTrigger>
                  <TabsTrigger value="templates">Templates</TabsTrigger>
                </TabsList>
                
                <div className="flex space-x-2">
                  <Button 
                    type="button" 
                    onClick={() => navigate({ to: "/" })}
                    className="h-8 px-4 py-1 rounded-md bg-muted text-muted-foreground text-sm hover:text-foreground hover:bg-muted/80"
                    variant="ghost"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    form="character-form"
                    disabled={isSubmitting || templateEditMode !== null}
                    className="h-8 px-4 py-1 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90"
                  >
                    {isSubmitting ? "Saving..." : "Save Character"}
                  </Button>
                </div>
              </div>
              
              <TabsContent value="character" className="p-1">
                {renderCharacterTab()}
              </TabsContent>
              
              <TabsContent value="clients" className="p-1">
                {renderClientsTab()}
              </TabsContent>
              
              <TabsContent value="plugins" className="p-1">
                {renderPluginsTab()}
              </TabsContent>
              
              <TabsContent value="templates" className="p-1">
                {renderTemplatesTab()}
              </TabsContent>
            </Tabs>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="border-t flex justify-between pt-6">
        <Button 
          type="button"
          variant="destructive" 
          onClick={() => setShowDeleteDialog(true)}
          disabled={isDeleting}
        >
          {isDeleting ? "Deleting..." : "Delete Character"}
        </Button>
        
        <div className="flex justify-between mt-6">
          <div></div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                try {
                  // Manually reload character data
                  setIsSubmitting(true);
                  console.log("Manually refreshing character data...");
                  
                  // Force a reload of this specific character
                  const updatedCharacter = await apiClient.getUserCharacter(character.id);
                  if (updatedCharacter) {
                    console.log("Manually reloaded character:", updatedCharacter);
                    
                    // Update form with the latest data
                    form.reset({
                      name: updatedCharacter.name,
                      bio: Array.isArray(updatedCharacter.bio) ? updatedCharacter.bio.join('\n') : '',
                      lore: Array.isArray(updatedCharacter.lore) ? updatedCharacter.lore.join('\n') : '',
                      style: updatedCharacter.style || { all: [], chat: [], post: [] },
                      topics: updatedCharacter.topics || [],
                      adjectives: updatedCharacter.adjectives || [],
                      avatarUrl: updatedCharacter.avatarUrl || '',
                      clients: updatedCharacter.clients || [],
                      plugins: updatedCharacter.plugins || [],
                      knowledge: updatedCharacter.knowledge || [],
                      templates: updatedCharacter.templates || {}
                    });
                    
                    toast({
                      title: "Refreshed",
                      description: "Character data has been refreshed"
                    });
                  }
                } catch (error) {
                  console.error("Error refreshing character data:", error);
                  toast({
                    title: "Refresh failed",
                    description: "Failed to refresh character data. Please try again.",
                    variant: "destructive"
                  });
                } finally {
                  setIsSubmitting(false);
                }
              }}
              disabled={isSubmitting}
            >
              <RefreshIcon className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </div>
        
        {showDeleteDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-background p-6 rounded-lg max-w-md w-full">
              <h2 className="text-lg font-semibold mb-2">Are you sure?</h2>
              <p className="text-muted-foreground mb-4">
                This will permanently delete your character. This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowDeleteDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleDeleteCharacter}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardFooter>
    </Card>
  );
} 