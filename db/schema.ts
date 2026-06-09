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

export const userSettings = pgTable("user_settings", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  theme: text("theme").notNull().default("system"),
  notificationsEnabled: boolean("notifications_enabled").notNull().default(true),
  defaultCalendarView: text("default_calendar_view").notNull().default("month"),
  defaultTaskPriority: text("default_task_priority").notNull().default("medium"),
  autoSaveEnabled: boolean("auto_save_enabled").notNull().default(true),
  
  // AI Settings
  aiModel: text("ai_model").notNull().default("gemini-2.5-flash"),
  aiBehavior: text("ai_behavior").notNull().default(""),
  aiTone: text("ai_tone").notNull().default("cozy"),
  aiFeatures: text("ai_features").notNull().default("refine,assistant,template"),
  
  // Subscription Info
  subscriptionPlan: text("subscription_plan").notNull().default("Free Tier"),
  subscriptionStatus: text("subscription_status").notNull().default("active"),
  subscriptionRenewal: timestamp("subscription_renewal"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type UserSettings = typeof userSettings.$inferSelect;
export type NewUserSettings = typeof userSettings.$inferInsert;

export const categories = pgTable("categories", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // "calendar" | "kanban" | "notes" | "reminders"
  color: text("color").notNull(), // hex color or tailwind class
  icon: text("icon").notNull().default("Tag"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;

