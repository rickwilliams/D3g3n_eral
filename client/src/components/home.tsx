import { useState, useEffect } from 'react';
import { getCharacters } from '../lib/character-api';
import { CharacterSummary } from '../types/character';
import { toast } from '../components/ui/use-toast';

export function Home() {
  const [characters, setCharacters] = useState<CharacterSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchCharacters = async () => {
      setIsLoading(true);
      try {
        const characters = await getCharacters();
        setCharacters(characters);
      } catch (error) {
        console.error('Error fetching characters:', error);
        toast({
          title: "Error fetching characters",
          description: error instanceof Error ? error.message : "An unknown error occurred",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCharacters();
  }, []);

  // ... rest of the component ...
} 