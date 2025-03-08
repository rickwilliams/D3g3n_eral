import { useEffect, useState } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@clerk/clerk-react";
import PageTitle from "@/components/page-title";
import { EditCharacterForm } from "@/components/edit-character";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api";

export default function EditCharacterPage() {
  const params = useParams({ from: "/layout/edit-character/$characterId" });
  const characterId = params.characterId;
  const navigate = useNavigate();
  const { isSignedIn } = useAuth();
  const [character, setCharacter] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleSuccess = () => {
    navigate({ to: "/" });
  };

  useEffect(() => {
    const fetchCharacter = async () => {
      if (!isSignedIn) {
        setError("You must be signed in to edit a character");
        setLoading(false);
        return;
      }

      try {
        // Use the new API client to fetch the character
        const characterData = await apiClient.getUserCharacter(characterId);

        if (!characterData) {
          throw new Error("Character not found");
        }

        setCharacter(characterData);
      } catch (err) {
        console.error("Error fetching character:", err);
        setError(err instanceof Error ? err.message : "Failed to load character");
      } finally {
        setLoading(false);
      }
    };

    fetchCharacter();
  }, [characterId, isSignedIn]);

  if (loading) {
    return (
      <div className="flex flex-col gap-6 items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading character...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <PageTitle title="Error" />
        <div className="max-w-4xl mx-auto w-full text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => navigate({ to: "/" })}>
            Return to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageTitle title={`Edit ${character?.name || 'Character'}`} />
      <div className="max-w-4xl mx-auto w-full">
        {character && (
          <EditCharacterForm character={character} onSuccess={handleSuccess} />
        )}
      </div>
    </div>
  );
} 