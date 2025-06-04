import { db, notes, favorites, type Note, type NewNote } from "~/db/schema";
import { sql, eq, and, or, ilike, desc } from "drizzle-orm";

export async function createNote(data: NewNote): Promise<Note> {
  const [note] = await db.insert(notes).values(data).returning();
  return note;
}

export async function getNoteById(id: number): Promise<Note | null> {
  const [note] = await db
    .select()
    .from(notes)
    .where(sql`${notes.id} = ${id}`);
  return note || null;
}

export async function getNoteByIdWithFavoriteStatus(
  id: number,
  userId: number
): Promise<(Note & { isFavorited: boolean }) | null> {
  const [note] = await db
    .select({
      id: notes.id,
      userId: notes.userId,
      title: notes.title,
      description: notes.description,
      createdAt: notes.createdAt,
      isFavorited: sql<boolean>`CASE WHEN ${favorites.id} IS NOT NULL THEN true ELSE false END`,
    })
    .from(notes)
    .leftJoin(
      favorites,
      and(
        eq(favorites.noteId, notes.id),
        eq(favorites.userId, userId)
      )
    )
    .where(eq(notes.id, id));
  
  return note || null;
}

export async function getNotesByUserId(
  userId: number,
  { page = 1, limit = 12 }: { page?: number; limit?: number } = {}
): Promise<{ 
  notes: (Note & { isFavorited: boolean })[]; 
  totalCount: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}> {
  // Get total count for pagination metadata
  const [{ count }] = await db
    .select({
      count: sql<number>`count(*)`,
    })
    .from(notes)
    .where(eq(notes.userId, userId));

  const totalCount = Number(count);
  const totalPages = Math.ceil(totalCount / limit);
  const offset = (page - 1) * limit;

  const baseQuery = db
    .select({
      id: notes.id,
      userId: notes.userId,
      title: notes.title,
      description: notes.description,
      createdAt: notes.createdAt,
      isFavorited: sql<boolean>`CASE WHEN ${favorites.id} IS NOT NULL THEN true ELSE false END`,
    })
    .from(notes)
    .leftJoin(
      favorites,
      and(
        eq(favorites.noteId, notes.id),
        eq(favorites.userId, userId)
      )
    )
    .where(eq(notes.userId, userId))
    .orderBy(sql`CASE WHEN ${favorites.id} IS NOT NULL THEN 0 ELSE 1 END, ${notes.createdAt} DESC`)
    .limit(limit)
    .offset(offset);

  const notesList = await baseQuery;

  return {
    notes: notesList,
    totalCount,
    totalPages,
    currentPage: page,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

export async function updateNote(
  id: number,
  userId: number,
  data: Partial<NewNote>
): Promise<Note | null> {
  const [note] = await db
    .update(notes)
    .set(data)
    .where(sql`${notes.id} = ${id} AND ${notes.userId} = ${userId}`)
    .returning();
  return note || null;
}

export async function deleteNote(id: number, userId: number): Promise<boolean> {
  const [note] = await db
    .delete(notes)
    .where(sql`${notes.id} = ${id} AND ${notes.userId} = ${userId}`)
    .returning();
  return !!note;
}

// Simple search function that extends the existing getNotesByUserId
export async function searchNotesByUserId(
  userId: number,
  {
    query = "",
    page = 1,
    limit = 12,
    sortBy = "date",
    favoritesOnly = false,
  }: {
    query?: string;
    page?: number;
    limit?: number;
    sortBy?: "relevance" | "date" | "title";
    favoritesOnly?: boolean;
  } = {}
): Promise<{
  notes: (Note & { isFavorited: boolean })[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  searchQuery: string;
}> {
  const searchTerm = query.trim();
  
  // If no search term and no favorites filter, use the existing function
  if (!searchTerm && !favoritesOnly) {
    const result = await getNotesByUserId(userId, { page, limit });
    return {
      ...result,
      searchQuery: searchTerm,
    };
  }

  const offset = (page - 1) * limit;

  // Build the search query
  let countConditions = `user_id = ${userId}`;
  let selectConditions = `notes.user_id = ${userId}`;
  
  if (searchTerm) {
    const searchCondition = `(LOWER(title) LIKE LOWER('%${searchTerm}%') OR LOWER(description) LIKE LOWER('%${searchTerm}%'))`;
    countConditions += ` AND ${searchCondition}`;
    selectConditions += ` AND ${searchCondition}`;
  }

  if (favoritesOnly) {
    countConditions += ` AND EXISTS (SELECT 1 FROM favorites WHERE favorites.note_id = notes.id AND favorites.user_id = ${userId})`;
    selectConditions += ` AND favorites.id IS NOT NULL`;
  }

  // Get total count
  const countResult = await db.execute(sql`
    SELECT COUNT(*) as count 
    FROM notes 
    WHERE ${sql.raw(countConditions)}
  `);
  const totalCount = Number(countResult.rows[0].count);
  const totalPages = Math.ceil(totalCount / limit);

  // Get notes with search
  let orderBy = '';
  if (sortBy === 'title') {
    orderBy = `
      CASE WHEN favorites.id IS NOT NULL THEN 0 ELSE 1 END,
      notes.title ASC,
      notes.created_at DESC
    `;
  } else if (sortBy === 'relevance' && searchTerm) {
    orderBy = `
      CASE WHEN favorites.id IS NOT NULL THEN 0 ELSE 1 END,
      CASE WHEN LOWER(notes.title) LIKE LOWER('%${searchTerm}%') THEN 0 ELSE 1 END,
      notes.created_at DESC
    `;
  } else {
    orderBy = `
      CASE WHEN favorites.id IS NOT NULL THEN 0 ELSE 1 END,
      notes.created_at DESC
    `;
  }

  const selectResult = await db.execute(sql`
    SELECT 
      notes.id,
      notes.user_id,
      notes.title,
      notes.description,
      notes.created_at,
      CASE WHEN favorites.id IS NOT NULL THEN true ELSE false END as is_favorited
    FROM notes
    LEFT JOIN favorites ON favorites.note_id = notes.id AND favorites.user_id = ${userId}
    WHERE ${sql.raw(selectConditions)}
    ORDER BY ${sql.raw(orderBy)}
    LIMIT ${limit} OFFSET ${offset}
  `);

  const notes = selectResult.rows.map(row => ({
    id: row.id as number,
    userId: row.user_id as number,
    title: row.title as string,
    description: row.description as string,
    createdAt: row.created_at as Date,
    isFavorited: row.is_favorited as boolean,
  }));

  return {
    notes,
    totalCount,
    totalPages,
    currentPage: page,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
    searchQuery: searchTerm,
  };
}
