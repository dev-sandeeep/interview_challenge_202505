import { type Note } from "~/db/schema";
import { NoteCard } from "./note-card";

type SerializedNote = Omit<Note, "createdAt"> & { 
  createdAt: string;
  isFavorited: boolean;
};

interface NotesGridProps {
  notes: SerializedNote[];
  emptyMessage?: string;
}

export function NotesGrid({
  notes,
  emptyMessage = "No notes found.",
}: NotesGridProps) {
  if (notes.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed">
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {notes.map((note) => (
        <NoteCard key={note.id} note={note} />
      ))}
    </div>
  );
}
