import { db } from "~/db/schema";
import { favorites, type NewFavorite } from "~/db/schema";
import { eq, and } from "drizzle-orm";

export async function toggleFavorite(userId: number, noteId: number) {
  // Check if favorite exists
  const existingFavorite = await db
    .select()
    .from(favorites)
    .where(
      and(
        eq(favorites.userId, userId),
        eq(favorites.noteId, noteId)
      )
    )
    .limit(1);

  if (existingFavorite.length > 0) {
    // Remove favorite
    await db
      .delete(favorites)
      .where(
        and(
          eq(favorites.userId, userId),
          eq(favorites.noteId, noteId)
        )
      );
    return { isFavorited: false };
  } else {
    // Add favorite
    const newFavorite: NewFavorite = {
      userId,
      noteId,
    };
    await db.insert(favorites).values(newFavorite);
    return { isFavorited: true };
  }
}

export async function getUserFavorites(userId: number) {
  const userFavorites = await db
    .select({
      id: favorites.id,
      noteId: favorites.noteId,
      createdAt: favorites.createdAt,
    })
    .from(favorites)
    .where(eq(favorites.userId, userId));

  return userFavorites;
}

export async function isNoteFavorited(userId: number, noteId: number) {
  const favorite = await db
    .select()
    .from(favorites)
    .where(
      and(
        eq(favorites.userId, userId),
        eq(favorites.noteId, noteId)
      )
    )
    .limit(1);

  return favorite.length > 0;
} 