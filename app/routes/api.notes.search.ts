import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { requireAuthApi } from "~/middleware/auth";
import { searchNotesByUserId } from "~/services/notes.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { userId } = await requireAuthApi(request);
  
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get("q") || "";
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "12", 10);
    const sortBy = (url.searchParams.get("sort") as "relevance" | "date" | "title") || "date";
    const favoritesOnly = url.searchParams.get("favorites") === "true";
    
    const searchData = await searchNotesByUserId(userId, { 
      query, 
      page, 
      limit, 
      sortBy,
      favoritesOnly 
    });

    return json({
      success: true,
      ...searchData,
    });
  } catch (error) {
    console.error("Failed to search notes:", error);
    return json({ error: "Failed to search notes" }, { status: 500 });
  }
} 