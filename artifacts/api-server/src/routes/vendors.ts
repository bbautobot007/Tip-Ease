import { Router } from "express";
import { eq, ilike, or } from "drizzle-orm";
import { db, vendorsTable, usersTable } from "@workspace/db";
import { v4 as uuidv4 } from "uuid";
import { requireAuth, getClerkUserId } from "../lib/auth";
import { getOrCreateUser } from "./users";
import {
  ListVendorsQueryParams,
  ListVendorsResponse,
  CreateVendorProfileBody,
  GetMyVendorProfileResponse,
  GetVendorEventsResponse,
} from "@workspace/api-zod";
import { eventsTable } from "@workspace/db";

const router = Router();

router.get("/vendors", async (req, res): Promise<void> => {
  const queryParams = ListVendorsQueryParams.safeParse(req.query);
  const q = queryParams.success ? queryParams.data.q : undefined;

  let vendors;
  if (q) {
    vendors = await db.select().from(vendorsTable)
      .where(
        or(
          ilike(vendorsTable.companyName, `%${q}%`),
          ilike(vendorsTable.contactName, `%${q}%`)
        )
      );
  } else {
    vendors = await db.select().from(vendorsTable)
      .where(eq(vendorsTable.status, "approved"))
      .limit(50);
  }

  res.json(ListVendorsResponse.parse(vendors.map(v => ({
    ...v,
    rating: v.rating ? parseFloat(v.rating) : null,
    totalEarnings: parseFloat(v.totalEarnings),
  }))));
});

router.post("/vendors", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req)!;
  const user = await getOrCreateUser(clerkId);
  const parsed = CreateVendorProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [vendor] = await db.insert(vendorsTable).values({
    id: uuidv4(),
    userId: user.id,
    email: user.email,
    companyName: parsed.data.companyName,
    contactName: parsed.data.contactName,
    phone: parsed.data.phone,
    businessRegNumber: parsed.data.businessRegNumber,
    status: "pending",
  }).returning();

  // Auto-approve for demo purposes
  const [approved] = await db.update(vendorsTable)
    .set({ status: "approved" })
    .where(eq(vendorsTable.id, vendor.id))
    .returning();

  res.status(201).json({
    ...approved,
    rating: approved.rating ? parseFloat(approved.rating) : null,
    totalEarnings: parseFloat(approved.totalEarnings),
  });
});

router.get("/vendors/me", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req)!;
  const user = await getOrCreateUser(clerkId);

  const [vendor] = await db.select().from(vendorsTable)
    .where(eq(vendorsTable.userId, user.id));

  if (!vendor) {
    res.status(404).json({ error: "Vendor profile not found" });
    return;
  }

  res.json(GetMyVendorProfileResponse.parse({
    ...vendor,
    rating: vendor.rating ? parseFloat(vendor.rating) : null,
    totalEarnings: parseFloat(vendor.totalEarnings),
  }));
});

router.get("/vendors/me/events", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req)!;
  const user = await getOrCreateUser(clerkId);

  const [vendor] = await db.select().from(vendorsTable)
    .where(eq(vendorsTable.userId, user.id));

  if (!vendor) {
    res.json([]);
    return;
  }

  const events = await db.select().from(eventsTable)
    .where(eq(eventsTable.vendorId, vendor.id));

  res.json(GetVendorEventsResponse.parse(events.map(e => ({
    ...e,
    totalTips: parseFloat(e.totalTips),
    perGuestCap: e.perGuestCap ? parseFloat(e.perGuestCap) : null,
    vendorName: e.vendorName ?? null,
    vendorId: e.vendorId ?? null,
    expectedGuests: e.expectedGuests ?? null,
  }))));
});

export default router;
