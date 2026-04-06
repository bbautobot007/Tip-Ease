import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const qrCodesTable = pgTable("qr_codes", {
  id: text("id").primaryKey(),
  eventId: text("event_id").notNull(),
  token: text("token").notNull().unique(),
  qrCodeUrl: text("qr_code_url").notNull(),
  status: text("status").notNull().default("active"),
  validFrom: timestamp("valid_from", { withTimezone: true }).notNull(),
  validUntil: timestamp("valid_until", { withTimezone: true }).notNull(),
  scanCount: integer("scan_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertQrCodeSchema = createInsertSchema(qrCodesTable).omit({ createdAt: true, updatedAt: true });
export type InsertQrCode = z.infer<typeof insertQrCodeSchema>;
export type QrCode = typeof qrCodesTable.$inferSelect;
