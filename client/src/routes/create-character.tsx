import { CreateCharacterForm } from "@/components/create-character-modal";
import { useNavigate } from "@tanstack/react-router";
import PageTitle from "@/components/page-title";

export default function CreateCharacterPage() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate({ to: "/" });
  };

  return (
    <div className="flex flex-col gap-6">
      <PageTitle title="Create a Character" />
      <div className="max-w-4xl mx-auto w-full">
        <CreateCharacterForm onSuccess={handleSuccess} />
      </div>
    </div>
  );
} 