import { db } from "@db";
import { users, notes, tags, todoItems, noteTags, spotifyTokens } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import fetch from "node-fetch";

export const storage = {
  // User operations
  async getUserById(id: number) {
    return await db.query.users.findFirst({
      where: eq(users.id, id),
    });
  },
  
  async getUserByUsername(username: string) {
    return await db.query.users.findFirst({
      where: eq(users.username, username),
    });
  },
  
  async insertUser(userData: any) {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  },
  
  // Note operations
  async getNotesByUserId(userId: number) {
    return await db.query.notes.findMany({
      where: eq(notes.userId, userId),
      orderBy: desc(notes.updatedAt),
    });
  },
  
  async getNoteById(id: number, userId: number) {
    return await db.query.notes.findFirst({
      where: and(
        eq(notes.id, id),
        eq(notes.userId, userId)
      ),
    });
  },
  
  async insertNote(noteData: any) {
    const [note] = await db.insert(notes).values(noteData).returning();
    return note;
  },
  
  async updateNote(id: number, noteData: any) {
    const [updatedNote] = await db.update(notes)
      .set(noteData)
      .where(eq(notes.id, id))
      .returning();
    return updatedNote;
  },
  
  async deleteNote(id: number) {
    await db.delete(notes).where(eq(notes.id, id));
  },
  
  // Tag operations
  async getTagsByUserId(userId: number) {
    return await db.query.tags.findMany({
      where: eq(tags.userId, userId),
    });
  },
  
  async insertTag(tagData: any) {
    const [tag] = await db.insert(tags).values(tagData).returning();
    return tag;
  },
  
  // Todo item operations
  async getTodoItemsByNoteId(noteId: number) {
    return await db.query.todoItems.findMany({
      where: eq(todoItems.noteId, noteId),
    });
  },
  
  async insertTodoItem(todoData: any) {
    const [todo] = await db.insert(todoItems).values(todoData).returning();
    return todo;
  },
  
  async updateTodoItem(id: number, todoData: any) {
    const [updatedTodo] = await db.update(todoItems)
      .set(todoData)
      .where(eq(todoItems.id, id))
      .returning();
    return updatedTodo;
  },
  
  async deleteTodoItem(id: number) {
    await db.delete(todoItems).where(eq(todoItems.id, id));
  },
  
  // Note-Tag operations
  async getNoteTagsByNoteId(noteId: number) {
    return await db.query.noteTags.findMany({
      where: eq(noteTags.noteId, noteId),
    });
  },
  
  async insertNoteTag(noteTagData: any) {
    const [noteTag] = await db.insert(noteTags).values(noteTagData).returning();
    return noteTag;
  },
  
  // Spotify operations
  async getSpotifyToken(userId: number) {
    const token = await db.query.spotifyTokens.findFirst({
      where: eq(spotifyTokens.userId, userId),
    });
    
    if (!token) {
      return null;
    }
    
    // Check if token is expired
    const now = new Date();
    if (token.expiresAt < now) {
      const refreshed = await this.refreshSpotifyToken(userId);
      if (!refreshed) {
        return null;
      }
      
      // Get the new token
      const newToken = await db.query.spotifyTokens.findFirst({
        where: eq(spotifyTokens.userId, userId),
      });
      
      return newToken?.accessToken || null;
    }
    
    return token.accessToken;
  },
  
  async refreshSpotifyToken(userId: number) {
    try {
      const token = await db.query.spotifyTokens.findFirst({
        where: eq(spotifyTokens.userId, userId),
      });
      
      if (!token) {
        return false;
      }
      
      const clientId = process.env.SPOTIFY_CLIENT_ID;
      const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
      
      const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: token.refreshToken,
        }).toString(),
      });
      
      if (!response.ok) {
        throw new Error("Failed to refresh token");
      }
      
      const data = await response.json();
      
      // Calculate new expiry time
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + data.expires_in);
      
      // Update tokens
      await db.update(spotifyTokens)
        .set({
          accessToken: data.access_token,
          expiresAt,
          ...(data.refresh_token ? { refreshToken: data.refresh_token } : {}),
        })
        .where(eq(spotifyTokens.userId, userId));
      
      return true;
    } catch (error) {
      console.error("Error refreshing Spotify token:", error);
      
      // Delete the token if refresh failed
      await db.delete(spotifyTokens).where(eq(spotifyTokens.userId, userId));
      
      return false;
    }
  },
};
