import { pgTable, text, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const tipsTable = pgTable("tips", {
  id: text("id").primaryKey(),
  eventId: text("event_id").notNull(),
  guestId: text("guest_id").notNull(),
  vendorId: text("vendor_id").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  eventName: text("event_name").notNull(),
  vendorName: text("vendor_name").notNull(),
  status: text("status").notNull().default("completed"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTipSchema = createInsertSchema(tipsTable).omit({ createdAt: true });
export type InsertTip = z.infer<typeof insertTipSchema>;
export type Tip = typeof tipsTable.$inferSelect;
