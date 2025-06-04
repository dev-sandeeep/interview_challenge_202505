import { ChevronLeftIcon, ChevronRightIcon } from "@radix-ui/react-icons";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  onPageChange: (page: number) => void;
  className?: string;
}

interface PaginationInfoProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  itemsPerPage: number;
  className?: string;
}

interface PerPageSelectorProps {
  currentLimit: number;
  onLimitChange: (limit: number) => void;
  options?: number[];
  className?: string;
}

export function PerPageSelector({
  currentLimit,
  onLimitChange,
  options = [6, 12, 24, 48],
  className,
}: PerPageSelectorProps) {
  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <span className="text-sm text-muted-foreground">Show:</span>
      <div className="flex gap-1">
        {options.map((option) => (
          <Button
            key={option}
            variant={currentLimit === option ? "default" : "ghost"}
            size="sm"
            onClick={() => onLimitChange(option)}
            className="h-8 px-2"
          >
            {option}
          </Button>
        ))}
      </div>
      <span className="text-sm text-muted-foreground">per page</span>
    </div>
  );
}

export function PaginationInfo({
  currentPage,
  totalPages,
  totalCount,
  itemsPerPage,
  className,
}: PaginationInfoProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalCount);

  return (
    <div className={cn("flex items-center text-sm text-muted-foreground", className)}>
      <p>
        Showing {startItem} to {endItem} of {totalCount} results
      </p>
    </div>
  );
}

export function Pagination({
  currentPage,
  totalPages,
  hasNextPage,
  hasPreviousPage,
  onPageChange,
  className,
}: PaginationProps) {
  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, "...");
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push("...", totalPages);
    } else {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav
      className={cn("flex items-center justify-center space-x-2", className)}
      aria-label="Pagination"
    >
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!hasPreviousPage}
        aria-label="Go to previous page"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Previous
      </Button>

      <div className="flex items-center space-x-1">
        {getVisiblePages().map((page, index) => (
          <div key={index}>
            {page === "..." ? (
              <span className="px-2 py-1 text-sm text-muted-foreground">
                ...
              </span>
            ) : (
              <Button
                variant={currentPage === page ? "default" : "ghost"}
                size="sm"
                onClick={() => onPageChange(page as number)}
                aria-label={`Go to page ${page}`}
                aria-current={currentPage === page ? "page" : undefined}
              >
                {page}
              </Button>
            )}
          </div>
        ))}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!hasNextPage}
        aria-label="Go to next page"
      >
        Next
        <ChevronRightIcon className="h-4 w-4" />
      </Button>
    </nav>
  );
} 