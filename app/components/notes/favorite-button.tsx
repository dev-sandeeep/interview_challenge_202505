import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { StarIcon } from "@radix-ui/react-icons";
import { useFetcher } from "@remix-run/react";

interface FavoriteButtonProps {
  noteId: number;
  initialIsFavorited: boolean;
}

export function FavoriteButton({ noteId, initialIsFavorited }: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(initialIsFavorited);
  const fetcher = useFetcher<{ isFavorited: boolean; error?: string }>();
  const isSubmitting = fetcher.state === "submitting";

  // Handle server response
  useEffect(() => {
    if (fetcher.data && fetcher.state === "idle") {
      if (fetcher.data.error) {
        // Revert optimistic update on error
        setIsFavorited(initialIsFavorited);
      } else {
        // Sync with server state
        setIsFavorited(fetcher.data.isFavorited);
      }
    }
  }, [fetcher.data, fetcher.state, initialIsFavorited]);

  const handleToggleFavorite = () => {
    const formData = new FormData();
    formData.append("noteId", noteId.toString());

    // Optimistically update UI
    setIsFavorited(!isFavorited);

    fetcher.submit(formData, {
      method: "POST",
      action: "/api/notes/favorite",
    });
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggleFavorite}
      disabled={isSubmitting}
      className={isFavorited ? "text-yellow-500" : "text-gray-400"}
      title={isFavorited ? "Remove from favorites" : "Add to favorites"}
    >
      <StarIcon className={`h-4 w-4 ${isFavorited ? "fill-current" : ""}`} />
    </Button>
  );
} 