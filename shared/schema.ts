import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  telegramChannelId: text("telegram_channel_id"),
  isAdmin: boolean("is_admin").default(false).notNull(),
});

export const folders = pgTable("folders", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // 'passage' or 'vocabulary'
  isPublic: boolean("is_public").default(false).notNull(),
});

export const passages = pgTable("passages", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  userId: integer("user_id").notNull(),
  folderId: integer("folder_id"),
  reactions: jsonb("reactions").$type<Record<string, number>>().default({}),
  isPublic: boolean("is_public").default(false).notNull(),
});

export const vocabulary = pgTable("vocabulary", {
  id: serial("id").primaryKey(),
  word: text("word").notNull(),
  definition: text("definition").notNull(),
  example: text("example"),
  userId: integer("user_id").notNull(),
  folderId: integer("folder_id"),
  reactions: jsonb("reactions").$type<Record<string, number>>().default({}),
  isPublic: boolean("is_public").default(false).notNull(),
});

export const writings = pgTable("writings", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  userId: integer("user_id").notNull(),
  reactions: jsonb("reactions").$type<Record<string, number>>().default({}),
  isPublic: boolean("is_public").default(false).notNull(),
});

export const speakings = pgTable("speakings", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  audioUrl: text("audio_url").notNull(),
  userId: integer("user_id").notNull(),
  reactions: jsonb("reactions").$type<Record<string, number>>().default({}),
  isPublic: boolean("is_public").default(false).notNull(),
});

export const feedback = pgTable("feedback", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  userId: integer("user_id").notNull(),
  targetType: text("target_type").notNull(), // 'writing' or 'speaking'
  targetId: integer("target_id").notNull(),
});

// Add achievement-related types after the existing table definitions
export const achievementTypes = [
  "completion",
  "streak",
  "mastery",
  "excellence",
  "champion",
  "legend",
] as const;

export type AchievementType = typeof achievementTypes[number];

// Add achievements table definition
export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(),
  label: text("label").notNull(),
  earnedAt: timestamp("earned_at").defaultNow().notNull(),
});

// Add insert schema for achievements
export const insertAchievementSchema = createInsertSchema(achievements).pick({
  type: true,
  label: true,
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  telegramChannelId: true,
  isAdmin: true,
});

export const insertFolderSchema = createInsertSchema(folders).pick({
  name: true,
  type: true,
  isPublic: true,
});

export const insertPassageSchema = createInsertSchema(passages).pick({
  title: true,
  content: true,
  folderId: true,
  isPublic: true,
});

export const insertVocabularySchema = createInsertSchema(vocabulary).pick({
  word: true,
  definition: true,
  example: true,
  folderId: true,
  isPublic: true,
});

export const insertWritingSchema = createInsertSchema(writings).pick({
  title: true,
  content: true,
  isPublic: true,
});

export const insertSpeakingSchema = createInsertSchema(speakings).pick({
  title: true,
  audioUrl: true,
  isPublic: true,
});

export const insertFeedbackSchema = createInsertSchema(feedback).pick({
  content: true,
  targetType: true,
  targetId: true,
});

// Add mood tracking table and types
export const moods = pgTable("moods", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  mood: text("mood").notNull(), // e.g. 'happy', 'tired', 'motivated', 'frustrated'
  note: text("note"), // Optional note about their mood
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Add the insert schema for moods
export const insertMoodSchema = createInsertSchema(moods).pick({
  mood: true,
  note: true,
});

// Add comments table definition
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  targetType: text("target_type").notNull(), // 'passage', 'vocabulary', 'writing', 'speaking'
  targetId: integer("target_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isPublic: boolean("is_public").default(false).notNull(),
});

// Add insert schema for comments
export const insertCommentSchema = createInsertSchema(comments).pick({
  content: true,
  targetType: true,
  targetId: true,
  isPublic: true,
});


// Add Comment types
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;

// Add to types export
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type Achievement = typeof achievements.$inferSelect;
export type InsertMood = z.infer<typeof insertMoodSchema>;
export type Mood = typeof moods.$inferSelect;

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Folder = typeof folders.$inferSelect;
export type Passage = typeof passages.$inferSelect;
export type Vocabulary = typeof vocabulary.$inferSelect;
export type Writing = typeof writings.$inferSelect;
export type Speaking = typeof speakings.$inferSelect;
export type Feedback = typeof feedback.$inferSelect;