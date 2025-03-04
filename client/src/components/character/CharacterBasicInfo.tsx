/**
 * CharacterBasicInfo Component
 * 
 * This component handles the basic information section of the character form,
 * including name, avatar URL, bio, and lore.
 */
import { UseFormReturn } from "react-hook-form";
import { CharacterFormValues } from "@/types/character";
import { FileUpload } from "@/components/ui/file-upload";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface CharacterBasicInfoProps {
  form: UseFormReturn<CharacterFormValues>;
  avatarFile: File | null;
  setAvatarFile: (file: File | null) => void;
  isBlobValid: boolean;
}

/**
 * Component for editing basic character information
 * 
 * @param form - The form instance from useCharacterForm
 * @param avatarFile - The current avatar file being uploaded
 * @param setAvatarFile - Function to set the avatar file
 * @param isBlobValid - Whether the current avatar blob URL is valid
 */
export function CharacterBasicInfo({ 
  form, 
  avatarFile, 
  setAvatarFile,
  isBlobValid
}: CharacterBasicInfoProps) {
  // Get the current values from the form
  const avatarUrl = form.watch("avatarUrl");
  
  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Character Name</FormLabel>
            <FormControl>
              <Input placeholder="Enter character name" {...field} />
            </FormControl>
            <FormDescription>
              The name of your character as it will appear to users.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="avatarUrl"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Avatar</FormLabel>
            <FormControl>
              <div className="space-y-4">
                {/* Show current avatar if URL exists and is valid */}
                {field.value && isBlobValid && (
                  <div className="flex items-center space-x-4">
                    <img 
                      src={field.value} 
                      alt="Character avatar" 
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <p className="text-sm text-muted-foreground">Current avatar</p>
                  </div>
                )}
                
                {/* File upload component */}
                <FileUpload
                  accept="image/*"
                  maxSize={5 * 1024 * 1024} // 5MB
                  onFileSelect={(file) => {
                    setAvatarFile(file);
                    // Create a temporary URL for preview
                    const previewUrl = URL.createObjectURL(file);
                    field.onChange(previewUrl);
                  }}
                  currentFile={avatarFile}
                />
                
                {/* Manual URL input */}
                <div className="mt-2">
                  <Input 
                    placeholder="Or enter avatar URL directly" 
                    value={field.value || ""}
                    onChange={(e) => {
                      field.onChange(e.target.value);
                      // Clear file selection if URL is entered manually
                      if (e.target.value && avatarFile) {
                        setAvatarFile(null);
                      }
                    }}
                  />
                </div>
              </div>
            </FormControl>
            <FormDescription>
              Upload an image or provide a URL for your character's avatar.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="bio"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Biography</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Enter character biography" 
                className="min-h-[120px]"
                value={Array.isArray(field.value) ? field.value.join('\n') : field.value}
                onChange={(e) => {
                  // Split text by newlines to store as array
                  const bioArray = e.target.value.split('\n');
                  field.onChange(bioArray);
                }}
              />
            </FormControl>
            <FormDescription>
              Describe your character's background, personality, and purpose.
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
            <FormLabel>Lore (Optional)</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Enter additional character lore" 
                className="min-h-[120px]"
                value={field.value ? (Array.isArray(field.value) ? field.value.join('\n') : field.value) : ""}
                onChange={(e) => {
                  // Split text by newlines to store as array
                  const loreArray = e.target.value.split('\n');
                  field.onChange(loreArray.length > 0 ? loreArray : undefined);
                }}
              />
            </FormControl>
            <FormDescription>
              Additional background information, history, or context for your character.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
} 