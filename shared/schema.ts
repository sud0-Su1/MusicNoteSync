import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// User table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  displayName: true,
  avatarUrl: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Tags table
export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull(),
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTagSchema = createInsertSchema(tags).pick({
  name: true,
  color: true,
  userId: true,
});

export type InsertTag = z.infer<typeof insertTagSchema>;
export type Tag = typeof tags.$inferSelect;

// Notes table
export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content"),
  type: text("type").notNull().default("note"), // "note", "todo", "quick_note"
  isFavorite: boolean("is_favorite").default(false),
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertNoteSchema = createInsertSchema(notes).pick({
  title: true,
  content: true,
  type: true,
  isFavorite: true,
  userId: true,
});

export type InsertNote = z.infer<typeof insertNoteSchema>;
export type Note = typeof notes.$inferSelect;

// TodoItems table
export const todoItems = pgTable("todo_items", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  isCompleted: boolean("is_completed").default(false),
  noteId: integer("note_id").references(() => notes.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertTodoItemSchema = createInsertSchema(todoItems).pick({
  content: true,
  isCompleted: true,
  noteId: true,
});

export type InsertTodoItem = z.infer<typeof insertTodoItemSchema>;
export type TodoItem = typeof todoItems.$inferSelect;

// NoteTags junction table
export const noteTags = pgTable("note_tags", {
  id: serial("id").primaryKey(),
  noteId: integer("note_id").references(() => notes.id).notNull(),
  tagId: integer("tag_id").references(() => tags.id).notNull(),
});

export const insertNoteTagSchema = createInsertSchema(noteTags).pick({
  noteId: true,
  tagId: true,
});

export type InsertNoteTag = z.infer<typeof insertNoteTagSchema>;
export type NoteTag = typeof noteTags.$inferSelect;

// SpotifyTokens table to store Spotify tokens
export const spotifyTokens = pgTable("spotify_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSpotifyTokenSchema = createInsertSchema(spotifyTokens).pick({
  userId: true,
  accessToken: true,
  refreshToken: true,
  expiresAt: true,
});

export type InsertSpotifyToken = z.infer<typeof insertSpotifyTokenSchema>;
export type SpotifyToken = typeof spotifyTokens.$inferSelect;

// Music playlist history
export const musicHistory = pgTable("music_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  trackId: text("track_id").notNull(),
  trackName: text("track_name").notNull(),
  artistName: text("artist_name").notNull(),
  albumArt: text("album_art"),
  playedAt: timestamp("played_at").defaultNow().notNull(),
});

export const insertMusicHistorySchema = createInsertSchema(musicHistory).pick({
  userId: true,
  trackId: true,
  trackName: true,
  artistName: true,
  albumArt: true,
});

export type InsertMusicHistory = z.infer<typeof insertMusicHistorySchema>;
export type MusicHistory = typeof musicHistory.$inferSelect;

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  notes: many(notes),
  tags: many(tags),
  spotifyTokens: many(spotifyTokens),
  musicHistory: many(musicHistory),
}));

export const notesRelations = relations(notes, ({ one, many }) => ({
  user: one(users, { fields: [notes.userId], references: [users.id] }),
  todoItems: many(todoItems),
  noteTags: many(noteTags),
}));

export const tagsRelations = relations(tags, ({ one, many }) => ({
  user: one(users, { fields: [tags.userId], references: [users.id] }),
  noteTags: many(noteTags),
}));

export const todoItemsRelations = relations(todoItems, ({ one }) => ({
  note: one(notes, { fields: [todoItems.noteId], references: [notes.id] }),
}));

export const noteTagsRelations = relations(noteTags, ({ one }) => ({
  note: one(notes, { fields: [noteTags.noteId], references: [notes.id] }),
  tag: one(tags, { fields: [noteTags.tagId], references: [tags.id] }),
}));

export const spotifyTokensRelations = relations(spotifyTokens, ({ one }) => ({
  user: one(users, { fields: [spotifyTokens.userId], references: [users.id] }),
}));

export const musicHistoryRelations = relations(musicHistory, ({ one }) => ({
  user: one(users, { fields: [musicHistory.userId], references: [users.id] }),
}));
