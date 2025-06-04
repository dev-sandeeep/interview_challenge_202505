import { type Note } from "~/db/schema";
import { formatDate } from "~/utils/date";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { FavoriteButton } from "./favorite-button";

type SerializedNote = Omit<Note, "createdAt"> & { 
  createdAt: string;
  isFavorited: boolean;
};

interface NoteDetailProps {
  note: SerializedNote;
}

export function NoteDetail({ note }: NoteDetailProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle>{note.title}</CardTitle>
            <CardDescription>Created {formatDate(note.createdAt)}</CardDescription>
          </div>
          <FavoriteButton noteId={note.id} initialIsFavorited={note.isFavorited} />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
          {note.description || ""}
        </p>
      </CardContent>
    </Card>
  );
}
