import { z } from "zod";

// Define the character schema using Zod for validation
export const characterSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Character name is required"),
  bio: z.union([z.string(), z.array(z.string())]),
  lore: z.array(z.string()).optional(),
  style: z.object({
    all: z.array(z.string()),
    chat: z.array(z.string()),
    post: z.array(z.string())
  }),
  topics: z.array(z.string()).optional(),
  adjectives: z.array(z.string()).optional(),
  avatarUrl: z.string().optional(),
  clients: z.array(z.string()),
  plugins: z.array(z.any()).optional(), // Allow for complex plugin objects
  knowledge: z.array(z.string()).default([]),
  templates: z.record(z.string()).default({}),
  modelProvider: z.string().default("openai"),
  imageModelProvider: z.string().optional(),
  imageVisionModelProvider: z.string().optional(),
  settings: z.object({
    ragKnowledge: z.boolean().optional(),
    secrets: z.record(z.string()).optional(),
    voice: z.object({
      model: z.string().optional(),
      url: z.string().optional(),
    }).optional(),
    model: z.string().optional(),
    modelConfig: z.object({
      maxInputTokens: z.number().optional(),
      maxOutputTokens: z.number().optional(),
      temperature: z.number().optional(),
      frequency_penalty: z.number().optional(),
      presence_penalty: z.number().optional()
    }).optional(),
    embeddingModel: z.string().optional(),
    imageSettings: z.object({
      modelProvider: z.string().optional(),
      steps: z.number().optional(),
      width: z.number().optional(),
      height: z.number().optional(),
      cfgScale: z.number().optional(),
      negativePrompt: z.string().optional(),
    }).optional(),
  }).optional(),
  owner_id: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  // Add any additional fields needed for ElizaOS compatibility
  messageExamples: z.array(z.any()).optional(),
  postExamples: z.array(z.any()).optional(),
  people: z.array(z.any()).optional(),
});

// Export the type
export type Character = z.infer<typeof characterSchema>;

// Form values type (used for the edit form)
export type CharacterFormValues = Omit<Character, 'id' | 'owner_id' | 'created_at' | 'updated_at'>;

// Character summary type (used for listing characters)
export type CharacterSummary = Pick<Character, 'id' | 'name' | 'avatarUrl' | 'created_at' | 'updated_at'> & {
  isBuiltIn?: boolean;
  isOwnedByUser?: boolean;
  bio?: string | string[];
};

// Validation function
export function validateCharacter(data: unknown): Character | null {
  try {
    return characterSchema.parse(data);
  } catch (error) {
    console.error('Character validation error:', error);
    return null;
  }
}

// Function to convert character to Supabase format
export function characterToSupabaseFormat(character: CharacterFormValues): any {
  return {
    name: character.name,
    avatarUrl: character.avatarUrl,
    details: character,
    // A placeholder email is required by the schema if needed
    email: character.name ? `${character.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}@example.com` : undefined,
  };
}

// Function to convert from Supabase format to Character
export function supabaseToCharacter(data: any): Character | null {
  if (!data) return null;
  
  const characterData = {
    id: data.id,
    name: data.name || '',
    avatarUrl: data.avatarUrl,
    ...data.details,
    owner_id: data.user_id,
    created_at: data.createdAt,
    updated_at: data.updatedAt
  };
  
  return validateCharacter(characterData);
} 