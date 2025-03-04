import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth, useUser } from "@clerk/clerk-react";
import { createSupabaseClient, setupTokenRetrieval } from "@/lib/auth";
import { v4 as uuidv4 } from 'uuid';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { uploadToS3, convertBlobToS3Url } from "@/lib/s3";

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
import { useToast } from "@/components/ui/use-toast";
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

interface CreateCharacterFormProps {
  onSuccess?: () => void;
}

export function CreateCharacterForm({ 
  onSuccess 
}: CreateCharacterFormProps) {
  const navigate = useNavigate();
  const { isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const { toast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState("character");
  const [knowledgeFiles, setKnowledgeFiles] = useState<File[]>([]);
  const [templateEditMode, setTemplateEditMode] = useState<string | null>(null);
  const [templateContent, setTemplateContent] = useState<string>("");
  
  // Initialize form
  const form = useForm<CharacterFormValues>({
    resolver: zodResolver(characterFormSchema),
    defaultValues: {
      name: "",
      bio: "",
      lore: "",
      style: {
        all: ["uses plain english", "friendly and helpful"],
        chat: ["conversational", "engaging"],
        post: ["concise", "informative"]
      },
      topics: [],
      adjectives: ["intelligent", "curious", "thoughtful"],
      avatarUrl: "",
      clients: ["direct", "auto"],
      plugins: [],
      knowledge: [],
      templates: {},
    },
  });

  // Set up token retrieval when the component mounts
  const setupAuth = useCallback(() => {
    if (isSignedIn && getToken) {
      setupTokenRetrieval(getToken, isSignedIn);
    }
  }, [isSignedIn, getToken]);

  useEffect(() => {
    setupAuth();
  }, [setupAuth]);

  const handleSubmit = async (values: CharacterFormValues) => {
    if (!isSignedIn || !user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create a character",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Format bio and lore as arrays
      const bioArray = values.bio.split('\n').filter(item => item.trim() !== '');
      const loreArray = values.lore ? values.lore.split('\n').filter(item => item.trim() !== '') : [];
      
      // Create unique ID for the character
      const characterId = uuidv4();
      
      // Upload avatar if provided
      let avatarUrl = values.avatarUrl || "";
      
      // Check if avatarUrl is a blob URL and convert it to an S3 URL
      if (avatarUrl && avatarUrl.startsWith('blob:')) {
        try {
          toast({
            title: "Uploading avatar",
            description: "Please wait while we upload your avatar image..."
          });
          
          avatarUrl = await convertBlobToS3Url(avatarUrl);
          
          toast({
            title: "Avatar uploaded",
            description: "Your avatar has been successfully uploaded to S3."
          });
        } catch (uploadError) {
          console.error('Error uploading avatar to S3:', uploadError);
          toast({
            title: "Avatar upload failed",
            description: "We couldn't upload your avatar. Using default avatar instead.",
            variant: "destructive"
          });
          avatarUrl = ""; // Reset to empty if upload failed
        }
      } else if (avatarFile) {
        // If we have a file object but no URL, upload directly
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
          avatarUrl = ""; // Reset to empty if upload failed
        }
      }

      // Construct the character data in the right format
      const characterDetails = {
        id: characterId,
        name: values.name,
        bio: bioArray,
        lore: loreArray,
        style: values.style,
        people: [],
        topics: values.topics,
        adjectives: values.adjectives,
        clients: values.clients,
        plugins: values.plugins.map(plugin => ({
          name: plugin,
          // This is simplified - in a real implementation we'd include proper plugin configs
          actions: [],
          clients: [],
          services: [],
          providers: [],
          evaluators: [],
          description: `${plugin} functionality`
        })),
        settings: {
          voice: {
            model: "en_US-female-medium"
          },
          secrets: {},
          ragKnowledge: knowledgeFiles.length > 0,
          imageSettings: {
            steps: 20,
            width: 1024,
            height: 1024,
            modelId: "FLUX.1-dev",
            modelProvider: "heurist"
          }
        },
        knowledge: values.knowledge,
        templates: values.templates,
        postExamples: [],
        modelProvider: "anthropic",
        messageExamples: [
          [
            {
              user: "{{user1}}",
              content: {
                text: `Hello ${values.name}, can you introduce yourself?`
              }
            },
            {
              user: values.name,
              content: {
                text: `Hi there! I'm ${values.name}. ${bioArray[0] || 'Nice to meet you!'}`
              }
            }
          ]
        ],
        imageModelProvider: "heurist",
        imageVisionModelProvider: "openai"
      };
      
      // Create character in Supabase accounts table
      const supabase = await createSupabaseClient();
      
      const { error } = await supabase
        .from('accounts')
        .insert({
          id: characterId,
          name: values.name,
          email: `${characterId}`, // Using the ID as email since it's required
          avatarUrl: avatarUrl,
          details: characterDetails,
          user_id: user.id
        });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Character created",
        description: `${values.name} has been created successfully!`
      });
      
      // Call the success callback
      if (onSuccess) {
        onSuccess();
      } else {
        // Navigate to the home page if no callback provided
        navigate({ to: "/" });
      }
    } catch (error) {
      console.error('Error creating character:', error);
      toast({
        title: "Failed to create character",
        description: `There was an error creating your character: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfigureTemplate = (templateId: string) => {
    // Get the current template content or provide a default
    const currentTemplate = form.getValues().templates[templateId] || getDefaultTemplateContent(templateId);
    setTemplateContent(currentTemplate);
    setTemplateEditMode(templateId);
  };

  const saveTemplateContent = () => {
    if (templateEditMode) {
      // Update the form value with the template content
      const templates = { ...form.getValues().templates, [templateEditMode]: templateContent };
      form.setValue('templates', templates);
      
      // Exit edit mode
      setTemplateEditMode(null);
      setTemplateContent("");
      
      toast({
        title: "Template saved",
        description: `${getTemplateName(templateEditMode)} has been updated.`
      });
    }
  };

  const getTemplateName = (templateId: string): string => {
    const template = templateOptions.find(t => t.value === templateId);
    return template ? template.label : templateId;
  };

  const getDefaultTemplateContent = (templateId: string): string => {
    switch (templateId) {
      case "goalTemplate":
        return "The primary goal of this character is to assist users by providing helpful and accurate information.";
      case "systemPrompt":
        return "You are a helpful and knowledgeable assistant named [Character Name]. You have expertise in [Topics] and are characterized by being [Adjectives].";
      case "objectivesTemplate":
        return "1. Provide accurate information to the user's queries\n2. Maintain a consistent personality\n3. Engage in helpful and constructive dialogue";
      default:
        return "";
    }
  };

  const renderCharacterTab = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
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
          render={({ field }) => (
            <FileUpload
              label="Avatar"
              description="Upload an image or provide a URL"
              value={field.value}
              onChange={field.onChange}
              onFileChange={setAvatarFile}
              accept="image/*"
            />
          )}
        />
        
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
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
          render={({ field }) => (
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
          
          <div className="space-y-4">
            <div className="flex items-center justify-center border-2 border-dashed rounded-md p-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Drag and drop files or click to browse
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    // Would implement file upload here
                    toast({
                      title: "File upload",
                      description: "In a production environment, this would allow multiple file uploads to S3 storage."
                    });
                  }}
                >
                  Upload Files
                </Button>
              </div>
            </div>
            
            {knowledgeFiles.length > 0 && (
              <div className="border rounded-md p-2">
                <p className="text-sm font-medium mb-2">Uploaded Files:</p>
                <ul className="space-y-1">
                  {knowledgeFiles.map((file, index) => (
                    <li key={index} className="text-sm text-muted-foreground">
                      {file.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderClientsTab = () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground mb-4">
        Select the clients that your character will be available on
      </p>
      
      <FormField
        control={form.control}
        name="clients"
        render={({ field }) => (
          <FormItem>
            <div className="grid grid-cols-1 gap-4">
              {clientOptions.map((client) => (
                <FormItem
                  key={client.value}
                  className="flex items-start space-x-3 space-y-0 border rounded-md p-4"
                >
                  <FormControl>
                    <Checkbox
                      checked={field.value.includes(client.value)}
                      onCheckedChange={(checked: boolean | 'indeterminate') => {
                        if (checked === true) {
                          field.onChange([...field.value, client.value]);
                        } else {
                          field.onChange(
                            field.value.filter((value) => value !== client.value)
                          );
                        }
                      }}
                    />
                  </FormControl>
                  <div className="space-y-1">
                    <FormLabel className="text-base">{client.label}</FormLabel>
                    <FormDescription>
                      {client.description || getClientDescription(client.value)}
                    </FormDescription>
                  </div>
                </FormItem>
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );

  const renderPluginsTab = () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground mb-4">
        Select the plugins to extend your character's capabilities
      </p>
      
      <FormField
        control={form.control}
        name="plugins"
        render={({ field }) => (
          <FormItem>
            <div className="grid grid-cols-1 gap-4">
              {pluginOptions.map((plugin) => (
                <FormItem
                  key={plugin.value}
                  className="flex items-start space-x-3 space-y-0 border rounded-md p-4"
                >
                  <FormControl>
                    <Checkbox
                      checked={field.value.includes(plugin.value)}
                      onCheckedChange={(checked: boolean | 'indeterminate') => {
                        if (checked === true) {
                          field.onChange([...field.value, plugin.value]);
                        } else {
                          field.onChange(
                            field.value.filter((value) => value !== plugin.value)
                          );
                        }
                      }}
                    />
                  </FormControl>
                  <div className="space-y-1">
                    <FormLabel className="text-base">{plugin.label}</FormLabel>
                    <FormDescription>
                      {plugin.description || getPluginDescription(plugin.value)}
                    </FormDescription>
                  </div>
                </FormItem>
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );

  const renderTemplatesTab = () => (
    <div className="space-y-4">
      {templateEditMode ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">{getTemplateName(templateEditMode)} Editor</h3>
            <div className="space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setTemplateEditMode(null)}
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                onClick={saveTemplateContent}
              >
                Save
              </Button>
            </div>
          </div>
          <Textarea 
            value={templateContent} 
            onChange={(e) => setTemplateContent(e.target.value)}
            placeholder={`Enter ${getTemplateName(templateEditMode)} content...`}
            className="min-h-[300px]"
          />
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-4">
            Configure templates to guide your character's behavior
          </p>
          
          <div className="grid grid-cols-1 gap-4">
            {templateOptions.map(template => (
              <div key={template.value} className="border rounded-md p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">{template.label}</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleConfigureTemplate(template.value)}
                  >
                    Configure
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {template.description}
                </p>
                {form.getValues().templates[template.value] && (
                  <div className="bg-muted p-2 rounded-md">
                    <p className="text-xs text-muted-foreground">
                      Template configured
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );

  // Helper functions for descriptions
  function getClientDescription(clientId: string): string {
    const client = clientOptions.find(c => c.value === clientId);
    if (client?.description) return client.description;
    
    switch (clientId) {
      case "direct":
        return "Direct interaction with users via chat interface";
      case "auto":
        return "Automated responses to user queries";
      case "twitter":
        return "Interact with users on Twitter/X";
      default:
        return "Client interface";
    }
  }

  function getPluginDescription(pluginId: string): string {
    const plugin = pluginOptions.find(p => p.value === pluginId);
    if (plugin?.description) return plugin.description;
    
    switch (pluginId) {
      case "web-search":
        return "Enable web search capabilities";
      case "image-generation":
        return "Allow the character to generate images";
      case "bootstrap":
        return "Basic initialization and setup functionality";
      default:
        return "Plugin functionality";
    }
  }

  // Scroll to top when switching tabs
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  // If not signed in, show auth message
  if (!isSignedIn) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Authentication Required</CardTitle>
          <CardDescription>
            You need to be signed in to create a character
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={() => navigate({ to: "/sign-in" })}>Sign In</Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle>Create a new character</CardTitle>
        <CardDescription>
          Fill out the form to create your custom character
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
                    {isSubmitting ? "Creating..." : "Create Character"}
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
    </Card>
  );
} 