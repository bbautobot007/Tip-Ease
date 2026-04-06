import { pgTable, text, numeric, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const eventsTable = pgTable("events", {
  id: text("id").primaryKey(),
  hostId: text("host_id").notNull(),
  vendorId: text("vendor_id"),
  name: text("name").notNull(),
  eventType: text("event_type").notNull(),
  venueName: text("venue_name").notNull(),
  venueAddress: text("venue_address").notNull(),
  startTime: timestamp("start_time", { withTimezone: true }).notNull(),
  endTime: timestamp("end_time", { withTimezone: true }).notNull(),
  expectedGuests: integer("expected_guests"),
  perGuestCap: numeric("per_guest_cap", { precision: 10, scale: 2 }),
  status: text("status").notNull().default("draft"),
  vendorConfirmed: boolean("vendor_confirmed").notNull().default(false),
  hostName: text("host_name").notNull(),
  vendorName: text("vendor_name"),
  totalTips: numeric("total_tips", { precision: 10, scale: 2 }).notNull().default("0"),
  tipCount: integer("tip_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertEventSchema = createInsertSchema(eventsTable).omit({ createdAt: true, updatedAt: true });
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof eventsTable.$inferSelect;
