import { json, type ActionFunctionArgs } from "@remix-run/node";
import { requireAuthApi } from "~/middleware/auth";
import { toggleFavorite } from "~/services/favorites.server";

export async function action({ request }: ActionFunctionArgs) {
  const { userId } = await requireAuthApi(request);

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  const formData = await request.formData();
  const noteId = parseInt(formData.get("noteId") as string, 10);

  if (isNaN(noteId)) {
    return json({ error: "Invalid note ID" }, { status: 400 });
  }

  try {
    const result = await toggleFavorite(userId, noteId);
    return json(result);
  } catch (error) {
    console.error("Failed to toggle favorite:", error);
    return json({ error: "Failed to toggle favorite" }, { status: 500 });
  }
} 