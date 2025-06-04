import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { requireAuthApi } from "~/middleware/auth";
import { getNotesByUserId } from "~/services/notes.server";

export async function loader({ request }: LoaderFunctionArgs) {
  // Ensure user is authenticated
  const { userId } = await requireAuthApi(request);

  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "12", 10);
    
    const paginationData = await getNotesByUserId(userId, { page, limit });

    return json({
      success: true,
      ...paginationData,
    });
  } catch (error) {
    console.error("Failed to fetch notes:", error);
    return json({ error: "Failed to fetch notes" }, { status: 500 });
  }
}
