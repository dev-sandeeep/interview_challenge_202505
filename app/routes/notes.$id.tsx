import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigation } from "@remix-run/react";
import { NoteDetail } from "~/components/notes/note-detail";
import { NoteDetailSkeleton } from "~/components/notes/note-detail-skeleton";
import { getNoteByIdWithFavoriteStatus } from "~/services/notes.server";
import { requireUserId } from "~/services/session.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const noteId = parseInt(params.id || "", 10);

  if (isNaN(noteId)) {
    throw new Response("Invalid note ID", { status: 400 });
  }

  const note = await getNoteByIdWithFavoriteStatus(noteId, userId);
  if (!note) {
    throw new Response("Note not found", { status: 404 });
  }

  // Security check: Ensure the note belongs to the current user
  if (note.userId !== userId) {
    throw new Response("Unauthorized", { status: 403 });
  }

  return json({ note });
}

export default function NoteDetailPage() {
  const { note } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";

  return (
    <div className="container py-8">
      {isLoading ? <NoteDetailSkeleton /> : <NoteDetail note={note} />}
    </div>
  );
}
