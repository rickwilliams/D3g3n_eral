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
  plugins: z.array(z.string()),
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
});

// Export the type
export type Character = z.infer<typeof characterSchema>;

// Form values type (used for the edit form)
export type CharacterFormValues = Omit<Character, 'id' | 'owner_id' | 'created_at' | 'updated_at'>;

// Character summary type (used for listing characters)
export type CharacterSummary = Pick<Character, 'id' | 'name' | 'avatarUrl' | 'created_at' | 'updated_at'>;

// Validation function
export function validateCharacter(data: unknown): Character | null {
  try {
    return characterSchema.parse(data);
  } catch (error) {
    console.error('Character validation error:', error);
    return null;
  }
} 