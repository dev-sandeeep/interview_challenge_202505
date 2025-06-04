import { Link } from "@remix-run/react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { type Note } from "~/db/schema";
import { formatRelativeTime } from "~/utils/date";
import { FavoriteButton } from "./favorite-button";

type SerializedNote = Omit<Note, "createdAt"> & { 
  createdAt: string;
  isFavorited: boolean;
};

interface NoteCardProps {
  note: SerializedNote;
}

export function NoteCard({ note }: NoteCardProps) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-none">
        <CardTitle className="line-clamp-2">
          <Link to={`/notes/${note.id}`} className="hover:underline">
            {note.title}
          </Link>
        </CardTitle>
        <FavoriteButton noteId={note.id} initialIsFavorited={note.isFavorited} />
      </CardHeader>
      <CardContent className="flex-1">
        <p className="line-clamp-3 text-sm text-muted-foreground">
          {note.description || ""}
        </p>
      </CardContent>
      <CardFooter className="flex-none border-t pt-4">
        <p className="text-xs text-muted-foreground">
          {formatRelativeTime(note.createdAt)}
        </p>
      </CardFooter>
    </Card>
  );
}
