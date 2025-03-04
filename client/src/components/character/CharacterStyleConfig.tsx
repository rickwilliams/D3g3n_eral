/**
 * CharacterStyleConfig Component
 * 
 * This component handles the style configuration section of the character form,
 * including topics, adjectives, and style settings.
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
import { Textarea } from "@/components/ui/textarea";

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

interface CharacterStyleConfigProps {
  form: UseFormReturn<CharacterFormValues>;
}

/**
 * Component for editing character style configuration
 * 
 * @param form - The form instance from useCharacterForm
 */
export function CharacterStyleConfig({ form }: CharacterStyleConfigProps) {
  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="topics"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Topics</FormLabel>
            <FormControl>
              <MultiSelect
                options={topicOptions}
                selected={field.value || []}
                onChange={field.onChange}
                placeholder="Select topics"
                creatable
              />
            </FormControl>
            <FormDescription>
              Topics that your character is knowledgeable about.
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
            <FormLabel>Adjectives</FormLabel>
            <FormControl>
              <MultiSelect
                options={adjectiveOptions}
                selected={field.value || []}
                onChange={field.onChange}
                placeholder="Select adjectives"
                creatable
              />
            </FormControl>
            <FormDescription>
              Adjectives that describe your character's personality.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="style.all"
        render={({ field }) => (
          <FormItem>
            <FormLabel>General Style</FormLabel>
            <FormControl>
              <MultiSelect
                options={[]}
                selected={field.value || []}
                onChange={field.onChange}
                placeholder="Add style traits"
                creatable
              />
            </FormControl>
            <FormDescription>
              Style traits that apply to all interactions.
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
                options={[]}
                selected={field.value || []}
                onChange={field.onChange}
                placeholder="Add chat style traits"
                creatable
              />
            </FormControl>
            <FormDescription>
              Style traits specific to chat interactions.
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
                options={[]}
                selected={field.value || []}
                onChange={field.onChange}
                placeholder="Add post style traits"
                creatable
              />
            </FormControl>
            <FormDescription>
              Style traits specific to social media posts.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
} 