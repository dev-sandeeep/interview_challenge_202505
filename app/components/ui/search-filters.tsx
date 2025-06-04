import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

interface SearchFiltersProps {
  sortBy: "relevance" | "date" | "title";
  onSortChange: (sort: "relevance" | "date" | "title") => void;
  favoritesOnly: boolean;
  onFavoritesOnlyChange: (favoritesOnly: boolean) => void;
  hasSearchQuery: boolean;
  className?: string;
}

export function SearchFilters({
  sortBy,
  onSortChange,
  favoritesOnly,
  onFavoritesOnlyChange,
  hasSearchQuery,
  className,
}: SearchFiltersProps) {
  const sortOptions = [
    { value: "relevance" as const, label: "Relevance", disabled: !hasSearchQuery },
    { value: "date" as const, label: "Date" },
    { value: "title" as const, label: "Title" },
  ];

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <div className="flex items-center gap-1">
        <span className="text-sm text-muted-foreground">Sort by:</span>
        {sortOptions.map((option) => (
          <Button
            key={option.value}
            variant={sortBy === option.value ? "default" : "ghost"}
            size="sm"
            onClick={() => onSortChange(option.value)}
            disabled={option.disabled}
            className="h-8"
          >
            {option.label}
          </Button>
        ))}
      </div>
      
      <div className="h-4 w-px bg-border" />
      
      <Button
        variant={favoritesOnly ? "default" : "ghost"}
        size="sm"
        onClick={() => onFavoritesOnlyChange(!favoritesOnly)}
        className="h-8"
      >
        ⭐ Favorites Only
      </Button>
    </div>
  );
} 