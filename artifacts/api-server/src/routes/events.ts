import { Router } from "express";
import { eq, or } from "drizzle-orm";
import { db, eventsTable, vendorsTable, notificationsTable } from "@workspace/db";
import { v4 as uuidv4 } from "uuid";
import { requireAuth, getClerkUserId } from "../lib/auth";
import { getOrCreateUser } from "./users";
import {
  ListEventsResponse,
  CreateEventBody,
  GetEventParams,
  GetEventResponse,
  UpdateEventParams,
  UpdateEventBody,
  UpdateEventResponse,
  ConfirmEventVendorParams,
  ConfirmEventVendorBody,
  ConfirmEventVendorResponse,
} from "@workspace/api-zod";

const router = Router();

function parseEvent(e: any) {
  return {
    ...e,
    totalTips: parseFloat(e.totalTips),
    perGuestCap: e.perGuestCap ? parseFloat(e.perGuestCap) : null,
    vendorName: e.vendorName ?? null,
    vendorId: e.vendorId ?? null,
    expectedGuests: e.expectedGuests ?? null,
  };
}

router.get("/events", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req)!;
  const user = await getOrCreateUser(clerkId);

  const events = await db.select().from(eventsTable)
    .where(or(eq(eventsTable.hostId, user.id), eq(eventsTable.vendorId, user.id)));

  res.json(ListEventsResponse.parse(events.map(parseEvent)));
});

router.post("/events", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req)!;
  const user = await getOrCreateUser(clerkId);
  const parsed = CreateEventBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  let vendorName: string | undefined;
  if (parsed.data.vendorId) {
    const [vendor] = await db.select().from(vendorsTable).where(eq(vendorsTable.id, parsed.data.vendorId));
    if (vendor) vendorName = vendor.companyName;
  }

  const status = parsed.data.vendorId ? "pending_vendor" : "draft";

  const [event] = await db.insert(eventsTable).values({
    id: uuidv4(),
    hostId: user.id,
    hostName: user.name,
    vendorId: parsed.data.vendorId,
    vendorName,
    name: parsed.data.name,
    eventType: parsed.data.eventType,
    venueName: parsed.data.venueName,
    venueAddress: parsed.data.venueAddress,
    startTime: new Date(parsed.data.startTime),
    endTime: new Date(parsed.data.endTime),
    expectedGuests: parsed.data.expectedGuests,
    perGuestCap: parsed.data.perGuestCap?.toString(),
    status,
    vendorConfirmed: false,
  }).returning();

  // Notify vendor if assigned
  if (parsed.data.vendorId && vendorName) {
    const [vendor] = await db.select().from(vendorsTable).where(eq(vendorsTable.id, parsed.data.vendorId));
    if (vendor) {
      await db.insert(notificationsTable).values({
        userId: vendor.userId,
        type: "event_invitation",
        message: `${user.name} has listed you as the service provider for "${event.name}". Please confirm or decline.`,
        read: false,
      });
    }
  }

  res.status(201).json(parseEvent(event));
});

router.get("/events/:eventId", requireAuth, async (req, res): Promise<void> => {
  const params = GetEventParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [event] = await db.select().from(eventsTable).where(eq(eventsTable.id, params.data.eventId));
  if (!event) {
    res.status(404).json({ error: "Event not found" });
    return;
  }

  res.json(GetEventResponse.parse(parseEvent(event)));
});

router.patch("/events/:eventId", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateEventParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const clerkId = getClerkUserId(req)!;
  const user = await getOrCreateUser(clerkId);
  const parsed = UpdateEventBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db.select().from(eventsTable).where(eq(eventsTable.id, params.data.eventId));
  if (!existing || existing.hostId !== user.id) {
    res.status(404).json({ error: "Event not found or not authorized" });
    return;
  }

  const updateData: any = {};
  if (parsed.data.name) updateData.name = parsed.data.name;
  if (parsed.data.status) updateData.status = parsed.data.status;
  if (parsed.data.perGuestCap !== undefined) updateData.perGuestCap = parsed.data.perGuestCap?.toString();

  const [updated] = await db.update(eventsTable)
    .set({ ...updateData, updatedAt: new Date() })
    .where(eq(eventsTable.id, params.data.eventId))
    .returning();

  res.json(UpdateEventResponse.parse(parseEvent(updated)));
});

router.post("/events/:eventId/confirm", requireAuth, async (req, res): Promise<void> => {
  const params = ConfirmEventVendorParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = ConfirmEventVendorBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const clerkId = getClerkUserId(req)!;
  const user = await getOrCreateUser(clerkId);

  const [event] = await db.select().from(eventsTable).where(eq(eventsTable.id, params.data.eventId));
  if (!event) {
    res.status(404).json({ error: "Event not found" });
    return;
  }

  const [vendor] = await db.select().from(vendorsTable).where(eq(vendorsTable.userId, user.id));
  if (!vendor || event.vendorId !== vendor.id) {
    res.status(403).json({ error: "Not authorized to confirm this event" });
    return;
  }

  const newStatus = parsed.data.confirmed ? "confirmed" : "draft";
  const [updated] = await db.update(eventsTable)
    .set({ vendorConfirmed: parsed.data.confirmed, status: newStatus, updatedAt: new Date() })
    .where(eq(eventsTable.id, params.data.eventId))
    .returning();

  // Notify host
  await db.insert(notificationsTable).values({
    userId: event.hostId,
    type: parsed.data.confirmed ? "vendor_confirmed" : "vendor_declined",
    message: parsed.data.confirmed
      ? `${vendor.companyName} has confirmed participation in "${event.name}". You can now generate a QR code.`
      : `${vendor.companyName} has declined participation in "${event.name}".`,
    read: false,
  });

  res.json(ConfirmEventVendorResponse.parse(parseEvent(updated)));
});

export default router;
