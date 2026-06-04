import { pgTable, serial, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  clerkUserId: text("clerk_user_id").notNull().unique(),
  name: text("name"),
  email: text("email").notNull().unique(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content"),
  authorId: serial("author_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const boards = pgTable("boards", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull(),
  ownerId: text("owner_id").notNull(), // Clerk User ID
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const boardShares = pgTable("board_shares", {
  id: serial("id").primaryKey(),
  boardId: text("board_id").notNull(),
  userEmail: text("user_email").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notes = pgTable("notes", {
  id: text("id").primaryKey(),
  title: text("title").notNull().default("Untitled Note"),
  content: text("content"),
  userId: text("user_id").notNull(),
  icon: text("icon").notNull().default("FileText"),
  color: text("color").notNull().default("gray"),
  isPinned: boolean("is_pinned").notNull().default(false),
  isTrash: boolean("is_trash").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Board = typeof boards.$inferSelect;
export type NewBoard = typeof boards.$inferInsert;
export type BoardShare = typeof boardShares.$inferSelect;
export type NewBoardShare = typeof boardShares.$inferInsert;
export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;

export const aiTemplates = pgTable("ai_templates", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  appName: text("app_name").notNull(),
  description: text("description"),
  icon: text("icon").notNull().default("Flame"),
  color: text("color").notNull().default("#F97316"),
  layout: text("layout").notNull().default("single-page"),
  config: text("config").notNull(),
  inSidebar: boolean("in_sidebar").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type AITemplate = typeof aiTemplates.$inferSelect;
export type NewAITemplate = typeof aiTemplates.$inferInsert;
