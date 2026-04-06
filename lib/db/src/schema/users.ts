import { pgTable, text, numeric, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: text("id").primaryKey(),
  clerkId: text("clerk_id").notNull().unique(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  phone: text("phone"),
  role: text("role"),
  limitTier: text("limit_tier").notNull().default("standard"),
  walletBalance: numeric("wallet_balance", { precision: 10, scale: 2 }).notNull().default("0"),
  stripeCustomerId: text("stripe_customer_id"),
  autoReload: boolean("auto_reload").notNull().default(false),
  autoReloadAmount: numeric("auto_reload_amount", { precision: 10, scale: 2 }),
  autoReloadThreshold: numeric("auto_reload_threshold", { precision: 10, scale: 2 }),
  dailyUsed: numeric("daily_used", { precision: 10, scale: 2 }).notNull().default("0"),
  dailyResetAt: timestamp("daily_reset_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ createdAt: true, updatedAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
