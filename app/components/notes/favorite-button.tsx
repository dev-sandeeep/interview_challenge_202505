import { useState, useEffect, useRef } from "react";
import { Button } from "~/components/ui/button";
import { StarIcon, StarFilledIcon } from "@radix-ui/react-icons";
import { useFetcher } from "@remix-run/react";
import { useToast } from "~/components/ui/toast";

interface FavoriteButtonProps {
  noteId: number;
  initialIsFavorited: boolean;
}

export function FavoriteButton({ noteId, initialIsFavorited }: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(initialIsFavorited);
  const [isAnimating, setIsAnimating] = useState(false);
  const fetcher = useFetcher<{ isFavorited: boolean; error?: string }>();
  const isSubmitting = fetcher.state === "submitting";
  const { addToast } = useToast();
  const lastActionRef = useRef<string | null>(null);

  // Handle server response
  useEffect(() => {
    if (fetcher.data && fetcher.state === "idle") {
      // Create unique key for this response to prevent duplicates
      const actionKey = `${noteId}-${fetcher.data.isFavorited ? 'add' : 'remove'}-${fetcher.data.error ? 'error' : 'success'}`;
      
      // Prevent duplicate toasts
      if (lastActionRef.current === actionKey) {
        return;
      }
      lastActionRef.current = actionKey;

      if (fetcher.data.error) {
        // Revert optimistic update on error
        setIsFavorited(initialIsFavorited);
        addToast({
          type: "error",
          message: "Failed to update favorite. Please try again.",
          duration: 4000,
          category: `favorite-${noteId}`,
        });
      } else {
        // Sync with server state and show success message
        const wasAdded = fetcher.data.isFavorited;
        setIsFavorited(wasAdded);
        
        if (wasAdded) {
          // Trigger star animation for favorites
          setIsAnimating(true);
          setTimeout(() => setIsAnimating(false), 300);
        }
        
        addToast({
          type: "success",
          message: wasAdded 
            ? "✨ Added to favorites successfully!" 
            : "Removed from favorites",
          duration: 4000,
          category: `favorite-${noteId}`,
        });
      }
    }
  }, [fetcher.data, fetcher.state, initialIsFavorited, addToast, noteId]);

  const handleToggleFavorite = () => {
    // Prevent multiple rapid clicks
    if (isSubmitting) return;
    
    const formData = new FormData();
    formData.append("noteId", noteId.toString());

    // Reset the last action ref when starting a new action
    lastActionRef.current = null;

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
      className={`transition-all duration-200 ${
        isFavorited 
          ? "text-yellow-500 hover:text-yellow-600 scale-110" 
          : "text-gray-400 hover:text-yellow-500"
      }`}
      title={isFavorited ? "Remove from favorites" : "Add to favorites"}
    >
      {isFavorited ? (
        <StarFilledIcon 
          className={`h-4 w-4 transition-all duration-200 drop-shadow-sm ${
            isSubmitting ? "animate-pulse" : ""
          } ${isAnimating ? "star-favorite" : ""}`} 
        />
      ) : (
        <StarIcon 
          className={`h-4 w-4 transition-all duration-200 ${
            isSubmitting ? "animate-pulse" : ""
          }`} 
        />
      )}
    </Button>
  );
} 