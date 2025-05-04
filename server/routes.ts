import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { 
  users, insertUserSchema, 
  notes, insertNoteSchema, 
  tags, insertTagSchema,
  todoItems, insertTodoItemSchema,
  noteTags, insertNoteTagSchema,
  spotifyTokens, insertSpotifyTokenSchema,
  musicHistory, insertMusicHistorySchema
} from "@shared/schema";
import { storage } from "./storage";
import { eq, and, desc, sql, like, or } from "drizzle-orm";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import fetch from "node-fetch";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { Pool } from "@neondatabase/serverless";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import crypto from "crypto";

// Helper function to hash passwords
function hashPassword(password: string): string {
  return crypto
    .createHash("sha256")
    .update(password)
    .digest("hex");
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  const PgSession = connectPgSimple(session);
  
  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL 
  });
  
  // Set up session management
  app.use(
    session({
      store: new PgSession({
        pool,
        tableName: "session",
        createTableIfMissing: true,
      }),
      secret: process.env.SESSION_SECRET || "notes-vibes-secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        secure: process.env.NODE_ENV === "production",
      },
    })
  );
  
  // Set up passport for user authentication
  app.use(passport.initialize());
  app.use(passport.session());
  
  // Serialize and deserialize user for session
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, id),
      });
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
  
  // Local strategy for username/password authentication
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await db.query.users.findFirst({
          where: eq(users.username, username),
        });
        
        if (!user) {
          return done(null, false, { message: "Incorrect username" });
        }
        
        const hashedPassword = hashPassword(password);
        
        if (user.password !== hashedPassword) {
          return done(null, false, { message: "Incorrect password" });
        }
        
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    })
  );
  
  // Middleware to check if user is logged in
  const isAuthenticated = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };
  
  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = insertUserSchema.parse({
        ...req.body,
        password: hashPassword(req.body.password),
      });
      
      const newUser = await db.insert(users).values(data).returning();
      
      // Log in the user
      req.login(newUser[0], (err: any) => {
        if (err) {
          return res.status(500).json({ message: "Error logging in" });
        }
        return res.status(201).json({
          id: newUser[0].id,
          username: newUser[0].username,
          displayName: newUser[0].displayName,
        });
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      console.error("Error registering user:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/auth/login", passport.authenticate("local"), (req, res) => {
    const user = req.user as any;
    res.json({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
    });
  });
  
  app.post("/api/auth/logout", (req, res, next) => {
    req.logout((err: any) => {
      if (err) {
        return next(err);
      }
      res.json({ message: "Logged out successfully" });
    });
  });
  
  app.get("/api/auth/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not logged in" });
    }
    
    const user = req.user as any;
    res.json({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
    });
  });
  
  // Note routes
  app.get("/api/notes", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const { type, search, tag } = req.query;
      
      let query = db.select({
        note: notes,
        tags: sql<any>`json_agg(json_build_object('id', ${tags.id}, 'name', ${tags.name}, 'color', ${tags.color}))`,
        todoCount: sql<number>`count(distinct ${todoItems.id})`,
        completedCount: sql<number>`count(distinct case when ${todoItems.isCompleted} = true then ${todoItems.id} end)`,
      })
        .from(notes)
        .leftJoin(noteTags, eq(notes.id, noteTags.noteId))
        .leftJoin(tags, eq(noteTags.tagId, tags.id))
        .leftJoin(todoItems, eq(notes.id, todoItems.noteId))
        .where(eq(notes.userId, user.id))
        .groupBy(notes.id)
        .orderBy(desc(notes.updatedAt));
      
      // Filter by type
      if (type) {
        query = query.where(eq(notes.type, type as string));
      }
      
      // Filter by search term
      if (search) {
        query = query.where(
          or(
            like(notes.title, `%${search}%`),
            like(notes.content, `%${search}%`)
          )
        );
      }
      
      // Filter by tag
      if (tag) {
        query = query.where(
          eq(tags.id, Number(tag))
        );
      }
      
      const results = await query;
      
      // Transform results to clean up the tags array
      const transformedResults = results.map((result) => {
        const { note, tags: tagArray, todoCount, completedCount } = result;
        const filteredTags = Array.isArray(tagArray) 
          ? tagArray.filter(t => t && t.id !== null) 
          : [];
          
        return {
          ...note,
          tags: filteredTags,
          todoCount,
          completedCount,
        };
      });
      
      res.json(transformedResults);
    } catch (error) {
      console.error("Error fetching notes:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/notes", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const { tagIds, todoItems: todos, ...noteData } = req.body;
      
      // Validate note data
      const validatedNoteData = insertNoteSchema.parse({
        ...noteData,
        userId: user.id,
      });
      
      // Insert note
      const [newNote] = await db.insert(notes).values(validatedNoteData).returning();
      
      // Insert todo items if they exist and note type is todo
      if (todos && todos.length > 0 && validatedNoteData.type === "todo") {
        const todoPromises = todos.map((todo: any) => {
          const validatedTodo = insertTodoItemSchema.parse({
            content: todo.content,
            isCompleted: todo.isCompleted || false,
            noteId: newNote.id,
          });
          
          return db.insert(todoItems).values(validatedTodo);
        });
        
        await Promise.all(todoPromises);
      }
      
      // Insert tag associations if they exist
      if (tagIds && tagIds.length > 0) {
        const tagPromises = tagIds.map((tagId: number) => {
          const validatedNoteTag = insertNoteTagSchema.parse({
            noteId: newNote.id,
            tagId,
          });
          
          return db.insert(noteTags).values(validatedNoteTag);
        });
        
        await Promise.all(tagPromises);
      }
      
      res.status(201).json(newNote);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      console.error("Error creating note:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/notes/:id", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const noteId = parseInt(req.params.id);
      
      // Fetch note with tags and todo items
      const noteResult = await db.select({
        note: notes,
        tags: sql<any>`json_agg(json_build_object('id', ${tags.id}, 'name', ${tags.name}, 'color', ${tags.color}))`,
      })
        .from(notes)
        .leftJoin(noteTags, eq(notes.id, noteTags.noteId))
        .leftJoin(tags, eq(noteTags.tagId, tags.id))
        .where(
          and(
            eq(notes.id, noteId),
            eq(notes.userId, user.id)
          )
        )
        .groupBy(notes.id);
      
      if (!noteResult.length) {
        return res.status(404).json({ message: "Note not found" });
      }
      
      // Fetch todo items separately
      const todoItemsResult = await db.select()
        .from(todoItems)
        .where(eq(todoItems.noteId, noteId));
      
      // Transform tags array to remove nulls
      const filteredTags = Array.isArray(noteResult[0].tags) 
        ? noteResult[0].tags.filter(t => t && t.id !== null) 
        : [];
      
      const result = {
        ...noteResult[0].note,
        tags: filteredTags,
        todoItems: todoItemsResult,
      };
      
      res.json(result);
    } catch (error) {
      console.error("Error fetching note:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.put("/api/notes/:id", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const noteId = parseInt(req.params.id);
      const { tagIds, todoItems: todos, ...noteData } = req.body;
      
      // Check if note exists and belongs to user
      const existingNote = await db.query.notes.findFirst({
        where: and(
          eq(notes.id, noteId),
          eq(notes.userId, user.id)
        ),
      });
      
      if (!existingNote) {
        return res.status(404).json({ message: "Note not found" });
      }
      
      // Update note
      await db.update(notes)
        .set({
          ...noteData,
          updatedAt: new Date(),
        })
        .where(eq(notes.id, noteId));
      
      // Handle todo items if note type is todo
      if (existingNote.type === "todo" || noteData.type === "todo") {
        // Delete existing todo items
        await db.delete(todoItems).where(eq(todoItems.noteId, noteId));
        
        // Insert new todo items
        if (todos && todos.length > 0) {
          const todoPromises = todos.map((todo: any) => {
            const validatedTodo = insertTodoItemSchema.parse({
              content: todo.content,
              isCompleted: todo.isCompleted || false,
              noteId: noteId,
            });
            
            return db.insert(todoItems).values(validatedTodo);
          });
          
          await Promise.all(todoPromises);
        }
      }
      
      // Handle tag associations
      if (tagIds !== undefined) {
        // Delete existing tag associations
        await db.delete(noteTags).where(eq(noteTags.noteId, noteId));
        
        // Insert new tag associations
        if (tagIds && tagIds.length > 0) {
          const tagPromises = tagIds.map((tagId: number) => {
            const validatedNoteTag = insertNoteTagSchema.parse({
              noteId: noteId,
              tagId,
            });
            
            return db.insert(noteTags).values(validatedNoteTag);
          });
          
          await Promise.all(tagPromises);
        }
      }
      
      const updatedNote = await db.query.notes.findFirst({
        where: eq(notes.id, noteId),
      });
      
      res.json(updatedNote);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      console.error("Error updating note:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.delete("/api/notes/:id", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const noteId = parseInt(req.params.id);
      
      // Check if note exists and belongs to user
      const existingNote = await db.query.notes.findFirst({
        where: and(
          eq(notes.id, noteId),
          eq(notes.userId, user.id)
        ),
      });
      
      if (!existingNote) {
        return res.status(404).json({ message: "Note not found" });
      }
      
      // Delete todo items
      await db.delete(todoItems).where(eq(todoItems.noteId, noteId));
      
      // Delete tag associations
      await db.delete(noteTags).where(eq(noteTags.noteId, noteId));
      
      // Delete note
      await db.delete(notes).where(eq(notes.id, noteId));
      
      res.json({ message: "Note deleted successfully" });
    } catch (error) {
      console.error("Error deleting note:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Tag routes
  app.get("/api/tags", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      
      const userTags = await db.select({
        tag: tags,
        noteCount: sql<number>`count(${noteTags.noteId})`,
      })
        .from(tags)
        .leftJoin(noteTags, eq(tags.id, noteTags.tagId))
        .where(eq(tags.userId, user.id))
        .groupBy(tags.id)
        .orderBy(tags.name);
      
      const formattedTags = userTags.map(({ tag, noteCount }) => ({
        ...tag,
        noteCount,
      }));
      
      res.json(formattedTags);
    } catch (error) {
      console.error("Error fetching tags:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/tags", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      
      const validatedTagData = insertTagSchema.parse({
        ...req.body,
        userId: user.id,
      });
      
      const [newTag] = await db.insert(tags).values(validatedTagData).returning();
      
      res.status(201).json(newTag);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      console.error("Error creating tag:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.put("/api/tags/:id", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const tagId = parseInt(req.params.id);
      
      // Check if tag exists and belongs to user
      const existingTag = await db.query.tags.findFirst({
        where: and(
          eq(tags.id, tagId),
          eq(tags.userId, user.id)
        ),
      });
      
      if (!existingTag) {
        return res.status(404).json({ message: "Tag not found" });
      }
      
      await db.update(tags)
        .set(req.body)
        .where(eq(tags.id, tagId));
      
      const updatedTag = await db.query.tags.findFirst({
        where: eq(tags.id, tagId),
      });
      
      res.json(updatedTag);
    } catch (error) {
      console.error("Error updating tag:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.delete("/api/tags/:id", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const tagId = parseInt(req.params.id);
      
      // Check if tag exists and belongs to user
      const existingTag = await db.query.tags.findFirst({
        where: and(
          eq(tags.id, tagId),
          eq(tags.userId, user.id)
        ),
      });
      
      if (!existingTag) {
        return res.status(404).json({ message: "Tag not found" });
      }
      
      // Delete tag associations
      await db.delete(noteTags).where(eq(noteTags.tagId, tagId));
      
      // Delete tag
      await db.delete(tags).where(eq(tags.id, tagId));
      
      res.json({ message: "Tag deleted successfully" });
    } catch (error) {
      console.error("Error deleting tag:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Spotify authentication routes
  app.get("/api/spotify/auth", isAuthenticated, (req, res) => {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const redirectUri = `${process.env.APP_URL || `http://${req.headers.host}`}/api/spotify/callback`;
    const scope = "user-read-private user-read-email user-read-playback-state user-modify-playback-state user-read-currently-playing streaming";
    
    const state = crypto.randomBytes(16).toString("hex");
    req.session.spotifyState = state;
    
    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId as string,
      scope,
      redirect_uri: redirectUri,
      state,
    });
    
    res.redirect(`https://accounts.spotify.com/authorize?${params.toString()}`);
  });
  
  app.get("/api/spotify/callback", isAuthenticated, async (req, res) => {
    const code = req.query.code as string;
    const state = req.query.state as string;
    
    if (!state || state !== req.session.spotifyState) {
      return res.status(400).json({ message: "State mismatch" });
    }
    
    try {
      const user = req.user as any;
      const clientId = process.env.SPOTIFY_CLIENT_ID;
      const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
      const redirectUri = `${process.env.APP_URL || `http://${req.headers.host}`}/api/spotify/callback`;
      
      // Exchange code for tokens
      const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
        }).toString(),
      });
      
      if (!tokenResponse.ok) {
        const error = await tokenResponse.text();
        throw new Error(`Spotify token error: ${error}`);
      }
      
      const tokenData = await tokenResponse.json();
      
      // Calculate expiry time
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + tokenData.expires_in);
      
      // Check if user already has tokens
      const existingToken = await db.query.spotifyTokens.findFirst({
        where: eq(spotifyTokens.userId, user.id),
      });
      
      if (existingToken) {
        // Update tokens
        await db.update(spotifyTokens)
          .set({
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            expiresAt,
          })
          .where(eq(spotifyTokens.userId, user.id));
      } else {
        // Insert new tokens
        await db.insert(spotifyTokens).values({
          userId: user.id,
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          expiresAt,
        });
      }
      
      // Redirect to frontend
      res.redirect("/#spotify-connected");
    } catch (error) {
      console.error("Error in Spotify callback:", error);
      res.redirect("/#spotify-error");
    }
  });
  
  app.get("/api/spotify/status", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      
      const token = await db.query.spotifyTokens.findFirst({
        where: eq(spotifyTokens.userId, user.id),
      });
      
      if (!token) {
        return res.json({ connected: false });
      }
      
      // Check if token is expired
      const now = new Date();
      const isExpired = token.expiresAt < now;
      
      // If token is not expired, return connected status
      if (!isExpired) {
        return res.json({ connected: true });
      }
      
      // Refresh token
      try {
        const clientId = process.env.SPOTIFY_CLIENT_ID;
        const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
        
        const refreshResponse = await fetch("https://accounts.spotify.com/api/token", {
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
        
        if (!refreshResponse.ok) {
          throw new Error("Failed to refresh token");
        }
        
        const refreshData = await refreshResponse.json();
        
        // Calculate new expiry time
        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + refreshData.expires_in);
        
        // Update tokens
        await db.update(spotifyTokens)
          .set({
            accessToken: refreshData.access_token,
            expiresAt,
            ...(refreshData.refresh_token ? { refreshToken: refreshData.refresh_token } : {}),
          })
          .where(eq(spotifyTokens.userId, user.id));
        
        return res.json({ connected: true });
      } catch (refreshError) {
        console.error("Error refreshing Spotify token:", refreshError);
        
        // Delete the token if refresh failed
        await db.delete(spotifyTokens).where(eq(spotifyTokens.userId, user.id));
        
        return res.json({ connected: false, message: "Token expired and refresh failed" });
      }
    } catch (error) {
      console.error("Error checking Spotify status:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/spotify/disconnect", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      
      await db.delete(spotifyTokens).where(eq(spotifyTokens.userId, user.id));
      
      res.json({ message: "Disconnected from Spotify" });
    } catch (error) {
      console.error("Error disconnecting from Spotify:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Spotify API proxy
  app.get("/api/spotify/me", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const accessToken = await storage.getSpotifyToken(user.id);
      
      if (!accessToken) {
        return res.status(401).json({ message: "Not connected to Spotify" });
      }
      
      const response = await fetch("https://api.spotify.com/v1/me", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, try to refresh
          const refreshed = await storage.refreshSpotifyToken(user.id);
          if (refreshed) {
            return res.redirect("/api/spotify/me");
          } else {
            return res.status(401).json({ message: "Spotify session expired" });
          }
        }
        
        throw new Error(`Spotify API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error fetching Spotify user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/spotify/player", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const accessToken = await storage.getSpotifyToken(user.id);
      
      if (!accessToken) {
        return res.status(401).json({ message: "Not connected to Spotify" });
      }
      
      const response = await fetch("https://api.spotify.com/v1/me/player", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      
      // No content means no active device
      if (response.status === 204) {
        return res.json({ isPlaying: false });
      }
      
      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, try to refresh
          const refreshed = await storage.refreshSpotifyToken(user.id);
          if (refreshed) {
            return res.redirect("/api/spotify/player");
          } else {
            return res.status(401).json({ message: "Spotify session expired" });
          }
        }
        
        throw new Error(`Spotify API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Record playback in history if playing
      if (data.is_playing) {
        const trackData = {
          userId: user.id,
          trackId: data.item.id,
          trackName: data.item.name,
          artistName: data.item.artists.map((a: any) => a.name).join(", "),
          albumArt: data.item.album.images[0]?.url,
        };
        
        // Only insert if we don't have a recent record of this track
        const recentTrack = await db.query.musicHistory.findFirst({
          where: and(
            eq(musicHistory.userId, user.id),
            eq(musicHistory.trackId, data.item.id)
          ),
          orderBy: desc(musicHistory.playedAt),
        });
        
        if (!recentTrack || (Date.now() - new Date(recentTrack.playedAt).getTime() > 5 * 60 * 1000)) {
          await db.insert(musicHistory).values(trackData);
        }
      }
      
      res.json(data);
    } catch (error) {
      console.error("Error fetching Spotify player:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/spotify/play", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const accessToken = await storage.getSpotifyToken(user.id);
      
      if (!accessToken) {
        return res.status(401).json({ message: "Not connected to Spotify" });
      }
      
      const { uri, deviceId } = req.body;
      const endpoint = `https://api.spotify.com/v1/me/player/play${deviceId ? `?device_id=${deviceId}` : ''}`;
      
      const body = uri ? JSON.stringify({ uris: [uri] }) : undefined;
      
      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body,
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, try to refresh
          const refreshed = await storage.refreshSpotifyToken(user.id);
          if (!refreshed) {
            return res.status(401).json({ message: "Spotify session expired" });
          }
          return res.redirect(307, "/api/spotify/play");
        }
        
        const errorText = await response.text();
        throw new Error(`Spotify API error: ${response.status} - ${errorText}`);
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error playing Spotify track:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/spotify/pause", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const accessToken = await storage.getSpotifyToken(user.id);
      
      if (!accessToken) {
        return res.status(401).json({ message: "Not connected to Spotify" });
      }
      
      const { deviceId } = req.body;
      const endpoint = `https://api.spotify.com/v1/me/player/pause${deviceId ? `?device_id=${deviceId}` : ''}`;
      
      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, try to refresh
          const refreshed = await storage.refreshSpotifyToken(user.id);
          if (!refreshed) {
            return res.status(401).json({ message: "Spotify session expired" });
          }
          return res.redirect(307, "/api/spotify/pause");
        }
        
        const errorText = await response.text();
        throw new Error(`Spotify API error: ${response.status} - ${errorText}`);
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error pausing Spotify playback:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/spotify/next", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const accessToken = await storage.getSpotifyToken(user.id);
      
      if (!accessToken) {
        return res.status(401).json({ message: "Not connected to Spotify" });
      }
      
      const { deviceId } = req.body;
      const endpoint = `https://api.spotify.com/v1/me/player/next${deviceId ? `?device_id=${deviceId}` : ''}`;
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, try to refresh
          const refreshed = await storage.refreshSpotifyToken(user.id);
          if (!refreshed) {
            return res.status(401).json({ message: "Spotify session expired" });
          }
          return res.redirect(307, "/api/spotify/next");
        }
        
        const errorText = await response.text();
        throw new Error(`Spotify API error: ${response.status} - ${errorText}`);
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error skipping to next track:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/spotify/previous", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const accessToken = await storage.getSpotifyToken(user.id);
      
      if (!accessToken) {
        return res.status(401).json({ message: "Not connected to Spotify" });
      }
      
      const { deviceId } = req.body;
      const endpoint = `https://api.spotify.com/v1/me/player/previous${deviceId ? `?device_id=${deviceId}` : ''}`;
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, try to refresh
          const refreshed = await storage.refreshSpotifyToken(user.id);
          if (!refreshed) {
            return res.status(401).json({ message: "Spotify session expired" });
          }
          return res.redirect(307, "/api/spotify/previous");
        }
        
        const errorText = await response.text();
        throw new Error(`Spotify API error: ${response.status} - ${errorText}`);
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error skipping to previous track:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.get("/api/spotify/playlists", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const accessToken = await storage.getSpotifyToken(user.id);
      
      if (!accessToken) {
        return res.status(401).json({ message: "Not connected to Spotify" });
      }
      
      const response = await fetch("https://api.spotify.com/v1/me/playlists?limit=50", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, try to refresh
          const refreshed = await storage.refreshSpotifyToken(user.id);
          if (refreshed) {
            return res.redirect("/api/spotify/playlists");
          } else {
            return res.status(401).json({ message: "Spotify session expired" });
          }
        }
        
        throw new Error(`Spotify API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error fetching Spotify playlists:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  return httpServer;
}
