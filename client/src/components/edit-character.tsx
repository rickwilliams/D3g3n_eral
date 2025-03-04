/**
 * EditCharacterForm Component
 * 
 * This component is the main form for editing a character.
 * It uses smaller components for different sections of the form.
 */
import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useUser } from "@clerk/clerk-react";
import { useCharacterForm } from "@/hooks/useCharacterForm";
import { useCharacter } from "@/hooks/useCharacter";
import { uploadToS3 } from "@/lib/s3";
import { useToast } from "@/hooks/use-toast";
import { Character } from "@/types/character";

// UI Components
import {
  Form,
} from "@/components/ui/form";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

// Character Form Sections
import { CharacterBasicInfo } from "@/components/character/CharacterBasicInfo";
import { CharacterStyleConfig } from "@/components/character/CharacterStyleConfig";
import { CharacterIntegrations } from "@/components/character/CharacterIntegrations";
import { CharacterTemplates } from "@/components/character/CharacterTemplates";

interface EditCharacterFormProps {
  character: Character; // The character to edit
  onSuccess?: () => void;
}

export function EditCharacterForm({ 
  character,
  onSuccess 
}: EditCharacterFormProps) {
  const navigate = useNavigate();
  const { isSignedIn } = useUser();
  const { user } = useUser();
  const { toast } = useToast();
  
  // State for UI
  const [activeTab, setActiveTab] = useState("character");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isBlobValid, setIsBlobValid] = useState<boolean>(true);
  
  // Initialize character hooks
  const { updateCharacter, deleteCharacter, isUpdating, isDeleting, error } = useCharacter(character.id);
  
  // Format bio and lore arrays to strings for the form
  const bioString = Array.isArray(character.bio) 
    ? character.bio.join('\n') 
    : character.bio || "";
    
  const loreString = Array.isArray(character.lore) 
    ? character.lore.join('\n') 
    : character.lore || "";
  
  // Initialize form with character data
  const { form, isSaving, setIsSaving } = useCharacterForm({
      name: character.name || "",
      bio: bioString,
      lore: loreString,
    // Convert the style object to a string if needed
    style: typeof character.style === 'string' ? character.style : JSON.stringify({
      all: ["uses plain english", "friendly and helpful"],
      chat: ["conversational", "engaging"],
      post: ["concise", "informative"]
    }),
    topics: character.topics || [],
    adjectives: character.adjectives || ["intelligent", "curious", "thoughtful"],
      avatarUrl: character.avatarUrl && character.avatarUrl.startsWith('blob:') ? "" : character.avatarUrl || "",
    clients: character.clients || ["direct", "auto"],
    plugins: character.plugins || [],
    knowledge: character.knowledge || [],
    templates: character.templates || {},
  });

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

  // Handle form submission
  const onSubmit = async (values: any) => {
    if (!isSignedIn) {
      toast({
        title: "Authentication required",
        description: "Please sign in to update your character.",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);

    try {
      // Handle avatar upload if there's a new file
      let finalAvatarUrl = values.avatarUrl;
      if (avatarFile) {
        try {
          const uploadedUrl = await uploadToS3(avatarFile);
          finalAvatarUrl = uploadedUrl;
        } catch (error) {
          console.error("Error uploading avatar:", error);
          toast({
            title: "Avatar upload failed",
            description: "Could not upload avatar image. Using previous URL if available.",
            variant: "destructive"
          });
        }
      }

      // Update the character with the new values
      const updatedCharacter = {
        ...values,
        avatarUrl: finalAvatarUrl,
      };
      
      const result = await updateCharacter(character.id, updatedCharacter);
      
      if (result.success) {
      toast({
          title: "Character updated",
          description: "Your character has been updated successfully.",
      });

      if (onSuccess) {
        onSuccess();
        }
      } else {
        toast({
          title: "Update failed",
          description: result.error || "Failed to update character. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error updating character:", error);
      toast({
        title: "Update failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle character deletion
  const handleDelete = async () => {
    if (!isSignedIn) {
      toast({
        title: "Authentication required",
        description: "Please sign in to delete your character.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const result = await deleteCharacter(character.id);
      
      if (result.success) {
        toast({
          title: "Character deleted",
          description: "Your character has been deleted successfully.",
        });
        
          if (onSuccess) {
            onSuccess();
        }
          } else {
        toast({
          title: "Deletion failed",
          description: result.error || "Failed to delete character. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error deleting character:", error);
      toast({
        title: "Deletion failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setShowDeleteDialog(false);
    }
  };

  return (
    <div className="space-y-6">
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs defaultValue="character" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4">
                  <TabsTrigger value="character">Character</TabsTrigger>
              <TabsTrigger value="style">Style</TabsTrigger>
              <TabsTrigger value="integrations">Integrations</TabsTrigger>
                  <TabsTrigger value="templates">Templates</TabsTrigger>
                </TabsList>
                
            <TabsContent value="character" className="space-y-6 pt-4">
              <CharacterBasicInfo 
                form={form} 
                avatarFile={avatarFile} 
                setAvatarFile={setAvatarFile}
                isBlobValid={isBlobValid}
              />
              </TabsContent>
              
            <TabsContent value="style" className="space-y-6 pt-4">
              <CharacterStyleConfig form={form} />
              </TabsContent>
              
            <TabsContent value="integrations" className="space-y-6 pt-4">
              <CharacterIntegrations form={form} />
              </TabsContent>
              
            <TabsContent value="templates" className="space-y-6 pt-4">
              <CharacterTemplates form={form} />
              </TabsContent>
            </Tabs>
          
          <div className="flex justify-between pt-6">
        <Button 
          type="button"
          variant="destructive" 
          onClick={() => setShowDeleteDialog(true)}
              disabled={isDeleting || isSaving}
        >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Character
        </Button>
        
            <div className="flex gap-2">
        <Button 
                type="button"
                  variant="outline" 
                onClick={() => navigate("/")}
                disabled={isDeleting || isSaving}
                >
                  Cancel
                </Button>
              
                <Button 
                type="submit"
                disabled={isDeleting || isSaving}
                >
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Character
                </Button>
            </div>
          </div>
        </form>
      </Form>
      
      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your character.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 