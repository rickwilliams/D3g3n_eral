/**
 * CharacterIntegrations Component
 * 
 * This component handles the integrations section of the character form,
 * including clients and plugins.
 */
import { UseFormReturn } from "react-hook-form";
import { CharacterFormValues } from "@/types/character";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { MultiSelect, Option } from "@/components/ui/multi-select";

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

interface CharacterIntegrationsProps {
  form: UseFormReturn<CharacterFormValues>;
}

/**
 * Component for editing character integrations
 * 
 * @param form - The form instance from useCharacterForm
 */
export function CharacterIntegrations({ form }: CharacterIntegrationsProps) {
  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="clients"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Clients</FormLabel>
            <FormControl>
              <MultiSelect
                options={clientOptions}
                selected={field.value || []}
                onChange={field.onChange}
                placeholder="Select clients"
              />
            </FormControl>
            <FormDescription>
              Platforms where this character will be available.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="plugins"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Plugins</FormLabel>
            <FormControl>
              <MultiSelect
                options={pluginOptions}
                selected={field.value || []}
                onChange={field.onChange}
                placeholder="Select plugins"
              />
            </FormControl>
            <FormDescription>
              Plugins that enhance this character's capabilities.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="knowledge"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Knowledge Files</FormLabel>
            <FormControl>
              <MultiSelect
                options={[]}
                selected={field.value || []}
                onChange={field.onChange}
                placeholder="Add knowledge files"
              />
            </FormControl>
            <FormDescription>
              Additional knowledge sources for the character.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
} 