import { pgTable, text, numeric, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const vendorsTable = pgTable("vendors", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  companyName: text("company_name").notNull(),
  contactName: text("contact_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  businessRegNumber: text("business_reg_number"),
  status: text("status").notNull().default("pending"),
  rating: numeric("rating", { precision: 3, scale: 2 }),
  totalEvents: integer("total_events").notNull().default(0),
  totalEarnings: numeric("total_earnings", { precision: 10, scale: 2 }).notNull().default("0"),
  pendingPayouts: numeric("pending_payouts", { precision: 10, scale: 2 }).notNull().default("0"),
  stripeAccountId: text("stripe_account_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertVendorSchema = createInsertSchema(vendorsTable).omit({ createdAt: true, updatedAt: true });
export type InsertVendor = z.infer<typeof insertVendorSchema>;
export type Vendor = typeof vendorsTable.$inferSelect;
