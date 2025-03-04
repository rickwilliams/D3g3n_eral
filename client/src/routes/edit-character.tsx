/**
 * Edit Character Page
 * 
 * This page allows users to edit an existing character.
 * It fetches the character data and passes it to the EditCharacterForm component.
 */
import { useNavigate } from "@tanstack/react-router";
import { useUser } from "@clerk/clerk-react";
import { useCharacter } from "@/hooks/useCharacter";
import PageTitle from "@/components/page-title";
import { EditCharacterForm } from "@/components/edit-character";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function EditCharacterPage() {
  // Get the character ID from the URL parameters
  const characterId = window.location.pathname.split('/').pop() || '';
  const navigate = useNavigate();
  const { isSignedIn } = useUser();
  const { toast } = useToast();
  
  // Use the character hook to fetch and manage the character
  const { 
    character, 
    isLoading, 
    error, 
    isOwner 
  } = useCharacter(characterId);

  // Navigate back to home after successful edit
  const handleSuccess = () => {
    navigate("/");
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading character...</p>
      </div>
    );
  }

  // Show error state
  if (error || !character) {
    return (
      <div className="flex flex-col gap-6">
        <PageTitle title="Error" />
        <div className="max-w-4xl mx-auto w-full text-center">
          <p className="text-red-500 mb-4">
            {error || "Character not found"}
          </p>
          <Button onClick={() => navigate("/")}>
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  // Show unauthorized state
  if (!isSignedIn || !isOwner) {
    return (
      <div className="flex flex-col gap-6">
        <PageTitle title="Unauthorized" />
        <div className="max-w-4xl mx-auto w-full text-center">
          <p className="text-red-500 mb-4">
            {!isSignedIn 
              ? "You must be signed in to edit a character" 
              : "You don't have permission to edit this character"}
          </p>
          <Button onClick={() => navigate("/")}>
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  // Show the edit form
  return (
    <div className="flex flex-col gap-6">
      <PageTitle title={`Edit ${character.name || 'Character'}`} />
      <div className="max-w-4xl mx-auto w-full">
        <EditCharacterForm 
          character={character} 
          onSuccess={handleSuccess} 
        />
      </div>
    </div>
  );
} 