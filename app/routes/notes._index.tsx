import {
  json,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
  redirect,
} from "@remix-run/node";
import { useLoaderData, useNavigation, useSearchParams, useNavigate, useActionData } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { NotesGrid } from "~/components/notes/notes-grid";
import { NoteForm } from "~/components/notes/note-form";
import { requireUserId } from "~/services/session.server";
import { createNote, getNotesByUserId, searchNotesByUserId } from "~/services/notes.server";
import { useState, useEffect } from "react";
import { PlusIcon } from "@radix-ui/react-icons";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading,
} from "~/components/ui/page-header";
import { Separator } from "~/components/ui/separator";
import { noteSchema } from "~/schemas/notes";
import { NotesGridSkeleton } from "~/components/notes/note-skeleton";
import { Pagination, PaginationInfo, PerPageSelector } from "~/components/ui/pagination";
import { SearchInput } from "~/components/ui/search-input";
import { SearchFilters } from "~/components/ui/search-filters";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const limit = parseInt(url.searchParams.get("limit") || "12", 10);
  const query = url.searchParams.get("q") || "";
  const sortBy = (url.searchParams.get("sort") as "relevance" | "date" | "title") || "date";
  const favoritesOnly = url.searchParams.get("favorites") === "true";

  // Use search function if there's a query or filters
  if (query || favoritesOnly || sortBy !== "date") {
    const searchData = await searchNotesByUserId(userId, { 
      query, 
      page, 
      limit, 
      sortBy,
      favoritesOnly 
    });
    return json(searchData);
  }

  // Otherwise use the regular function
  const paginationData = await getNotesByUserId(userId, { page, limit });
  return json({
    ...paginationData,
    searchQuery: "",
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  const formData = await request.formData();
  const data = {
    title: formData.get("title"),
    description: formData.get("description"),
  };

  const result = noteSchema.safeParse(data);

  if (!result.success) {
    return json(
      {
        success: false,
        errors: result.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  try {
    const note = await createNote({
      ...result.data,
      userId,
    });

    // Redirect after successful creation to clear actionData
    const url = new URL(request.url);
    return redirect(url.pathname + url.search);
  } catch (error) {
    console.error("Failed to create note:", error);
    return json({ error: "Failed to create note" }, { status: 500 });
  }
}

export default function NotesIndexPage() {
  const { 
    notes, 
    totalCount, 
    totalPages, 
    currentPage, 
    hasNextPage, 
    hasPreviousPage,
    searchQuery = "",
  } = useLoaderData<typeof loader>();
  
  // actionData is still needed for error handling
  const actionData = useActionData<{
    success?: boolean;
    errors?: Record<string, string[]>;
    error?: string;
  }>();
  
  const [isOpen, setIsOpen] = useState(false);
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";
  const isSubmitting = navigation.state === "submitting";
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Get current search and filter state from URL
  const currentLimit = parseInt(searchParams.get("limit") || "12", 10);
  const currentSort = (searchParams.get("sort") as "relevance" | "date" | "title") || "date";
  const currentFavoritesOnly = searchParams.get("favorites") === "true";

  // Close form when submission starts (since we redirect on success)
  useEffect(() => {
    if (isSubmitting && isOpen) {
      setIsOpen(false);
    }
  }, [isSubmitting, isOpen]);

  const updateUrl = (updates: Record<string, string | null>) => {
    const newSearchParams = new URLSearchParams(searchParams);
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "") {
        newSearchParams.delete(key);
      } else {
        newSearchParams.set(key, value);
      }
    });
    
    // Reset to page 1 when changing search/filters
    if (updates.q !== undefined || updates.sort !== undefined || updates.favorites !== undefined) {
      newSearchParams.set("page", "1");
    }
    
    navigate(`?${newSearchParams.toString()}`);
  };

  const handleSearchChange = (query: string) => {
    updateUrl({ q: query || null });
  };

  const handleSortChange = (sort: "relevance" | "date" | "title") => {
    updateUrl({ sort: sort === "date" ? null : sort });
  };

  const handleFavoritesOnlyChange = (favoritesOnly: boolean) => {
    updateUrl({ favorites: favoritesOnly ? "true" : null });
  };

  const handlePageChange = (page: number) => {
    updateUrl({ page: page.toString() });
  };

  const handleLimitChange = (limit: number) => {
    updateUrl({ 
      limit: limit === 12 ? null : limit.toString(),
      page: "1" 
    });
  };

  const handleOpenForm = () => {
    setIsOpen(true);
  };

  const handleCloseForm = () => {
    setIsOpen(false);
  };

  // No longer needed since we redirect on success
  const handleFormSuccess = () => {
    // This will be handled by the redirect
  };

  const hasActiveSearch = searchQuery || currentFavoritesOnly || currentSort !== "date";

  return (
    <div className="h-full min-h-screen bg-background">
      <div className="container px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        <div className="mx-auto space-y-8">
          <PageHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <PageHeaderHeading>Notes</PageHeaderHeading>
                <PageHeaderDescription>
                  {hasActiveSearch ? 
                    `Search results${searchQuery ? ` for "${searchQuery}"` : ""}` :
                    "Manage your notes and thoughts in one place."
                  }
                </PageHeaderDescription>
              </div>
              <Button
                onClick={handleOpenForm}
                disabled={isLoading || isSubmitting}
              >
                <PlusIcon className="mr-2 h-4 w-4" />
                {isSubmitting ? "Creating..." : "Create Note"}
              </Button>
            </div>
          </PageHeader>

          <Separator />

          {/* Search Section */}
          <Card>
            <CardHeader>
              <CardTitle>Search & Filter</CardTitle>
              <CardDescription>
                Find notes by title or content, and customize your view.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <SearchInput
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search notes by title or content..."
                className="max-w-md"
              />
              <SearchFilters
                sortBy={currentSort}
                onSortChange={handleSortChange}
                favoritesOnly={currentFavoritesOnly}
                onFavoritesOnlyChange={handleFavoritesOnlyChange}
                hasSearchQuery={!!searchQuery}
              />
            </CardContent>
          </Card>

          {isOpen ? (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>Create Note</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCloseForm}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </CardHeader>
              <CardContent>
                <NoteForm
                  onSuccess={handleFormSuccess}
                />
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    {hasActiveSearch ? "Search Results" : "Your Notes"}
                  </CardTitle>
                  <CardDescription>
                    {hasActiveSearch ? 
                      "Results matching your search criteria." :
                      "A list of all your notes. Click on a note to view its details."
                    }
                  </CardDescription>
                </div>
                {!isLoading && totalCount > 0 && (
                  <PaginationInfo
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalCount={totalCount}
                    itemsPerPage={currentLimit}
                    className="hidden sm:flex"
                  />
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoading ? <NotesGridSkeleton /> : <NotesGrid notes={notes} />}
              
              {/* Enhanced pagination with per-page selector */}
              {!isLoading && totalCount > 0 && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-6 border-t">
                    <PerPageSelector
                      currentLimit={currentLimit}
                      onLimitChange={handleLimitChange}
                      className="order-2 sm:order-1"
                    />
                    <PaginationInfo
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalCount={totalCount}
                      itemsPerPage={currentLimit}
                      className="order-1 sm:order-2 sm:hidden"
                    />
                  </div>
                  {totalPages > 1 && (
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      hasNextPage={hasNextPage}
                      hasPreviousPage={hasPreviousPage}
                      onPageChange={handlePageChange}
                      className="flex justify-center"
                    />
                  )}
                </div>
              )}
              
              {/* Enhanced empty state for search */}
              {!isLoading && totalCount === 0 && (
                <div className="text-center py-12">
                  {hasActiveSearch ? (
                    <div className="space-y-3">
                      <p className="text-muted-foreground">
                        No notes found matching your search criteria.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Try adjusting your search terms or removing filters.
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => {
                          updateUrl({ q: null, sort: null, favorites: null });
                        }}
                      >
                        Clear Search
                      </Button>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      No notes found. Create your first note to get started!
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
