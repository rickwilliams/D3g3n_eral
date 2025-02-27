import { useAuth, useUser } from "@clerk/clerk-react";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { createSupabaseClient, setupTokenRetrieval } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { v4 as uuidv4 } from 'uuid';

// Define schema for the form validation
const characterFormSchema = z.object({
  name: z.string().min(1, "Character name is required"),
  bio: z.string().min(1, "Character bio is required"),
  lore: z.string().optional(),
  style: z.string().optional(),
  topics: z.string().optional(),
  modelProvider: z.string().default("anthropic"),
  avatarUrl: z.string().optional(),
  username: z.string().optional(),
  adjectives: z.string().optional(),
});

type CharacterFormValues = z.infer<typeof characterFormSchema>;

export default function CreateCharacterPage() {
  const navigate = useNavigate();
  const { isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const { toast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState("");

  // Set up token retrieval when the component mounts - using useCallback
  // to ensure the function is stable across renders
  const setupAuth = useCallback(() => {
    if (isSignedIn && getToken) {
      setupTokenRetrieval(getToken, isSignedIn);
    }
  }, [isSignedIn, getToken]);

  // Call the setup function when the component mounts
  useEffect(() => {
    setupAuth();
  }, [setupAuth]);

  // Initialize react-hook-form
  const form = useForm<CharacterFormValues>({
    resolver: zodResolver(characterFormSchema),
    defaultValues: {
      name: "",
      bio: "",
      lore: "",
      style: "uses plain english, friendly and helpful",
      topics: "",
      modelProvider: "anthropic",
      avatarUrl: "",
      username: "",
      adjectives: "intelligent, curious, thoughtful",
    },
  });

  const handleSubmit = async (values: CharacterFormValues) => {
    if (!isSignedIn || !user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create a character",
        variant: "destructive"
      });
      navigate("/sign-in");
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Format bio and lore as arrays
      const bioArray = values.bio.split('\n').filter(item => item.trim() !== '');
      const loreArray = values.lore ? values.lore.split('\n').filter(item => item.trim() !== '') : [];
      const topicsArray = values.topics ? values.topics.split(',').map(topic => topic.trim()).filter(item => item !== '') : [];
      
      // Create default styles
      const styleItems = values.style ? values.style.split(',').map(style => style.trim()).filter(item => item !== '') : ["uses plain english", "friendly and helpful"];
      
      // Format adjectives as array
      const adjectivesArray = values.adjectives ? values.adjectives.split(',').map(adj => adj.trim()).filter(item => item !== '') : ["intelligent", "curious", "thoughtful"];
      
      // Create unique ID for the character
      const characterId = uuidv4();
      
      // Construct the character data in the right format
      const characterDetails = {
        id: characterId,
        name: values.name,
        bio: bioArray,
        lore: loreArray,
        style: {
          all: styleItems,
          chat: ["conversational", "engaging"],
          post: ["concise", "informative"]
        },
        people: [],
        topics: topicsArray,
        adjectives: adjectivesArray,
        clients: ["direct", "auto"],
        plugins: [
          {
            name: "webSearch",
            actions: [{
              name: "WEB_SEARCH",
              similes: ["SEARCH_WEB", "INTERNET_SEARCH", "LOOKUP"],
              examples: [],
              description: "Perform a web search to find information.",
              suppressInitialMessage: true
            }],
            clients: [],
            services: [{"tavilyClient":{}}],
            providers: [],
            evaluators: [],
            description: "Search the web and get news"
          }
        ],
        settings: {
          voice: {
            model: "en_US-female-medium"
          },
          secrets: {},
          ragKnowledge: false,
          imageSettings: {
            steps: 20,
            width: 1024,
            height: 1024,
            modelId: "FLUX.1-dev",
            modelProvider: "heurist"
          }
        },
        username: values.username || values.name,
        knowledge: [],
        templates: {},
        postExamples: [],
        modelProvider: values.modelProvider,
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
          name: values.name,
          username: values.username || values.name,
          email: `${characterId}`, // Using the ID as email since it's required
          avatarUrl: values.avatarUrl || "",
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
      
      // Navigate to the home page
      navigate("/");
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

  // Redirect if not signed in
  if (!isSignedIn) {
    return (
      <div className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              You need to be signed in to create a character
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => navigate("/sign-in")}>Sign In</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Create New Character</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Character Details</CardTitle>
          <CardDescription>
            Create a new AI character for ElizaOS. The more detailed you make your character, the more personality they'll have!
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., hacker_ai" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="avatarUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Avatar URL (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://example.com/avatar.png" 
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          setAvatarPreview(e.target.value);
                        }}
                      />
                    </FormControl>
                    {avatarPreview && (
                      <div className="mt-2">
                        <img 
                          src={avatarPreview} 
                          alt="Character avatar preview" 
                          className="w-16 h-16 rounded-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/elizaos-icon.png';
                          }}
                        />
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="modelProvider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model Provider</FormLabel>
                    <FormControl>
                      <select 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                      >
                        <option value="anthropic">Anthropic (Claude)</option>
                        <option value="openai">OpenAI (GPT)</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="style"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Character Style (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="How should your character speak or respond? e.g., 'uses short sentences, speaks formally, uses technical jargon'"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="topics"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Topics of Interest (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="technology, philosophy, art, etc. (comma separated)" 
                        {...field}
                      />
                    </FormControl>
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
                      <Input 
                        placeholder="intelligent, curious, thoughtful (comma separated)" 
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            
            <CardFooter className="flex justify-between">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => navigate("/")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Character"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
} 