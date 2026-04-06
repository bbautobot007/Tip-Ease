import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, eventsTable, qrCodesTable } from "@workspace/db";
import { v4 as uuidv4 } from "uuid";
import QRCode from "qrcode";
import { requireAuth, getClerkUserId } from "../lib/auth";
import { getOrCreateUser } from "./users";
import {
  GenerateQrCodeParams,
  GetEventQrCodeParams,
  GetEventQrCodeResponse,
  RevokeEventQrCodeParams,
  RevokeEventQrCodeResponse,
  ValidateQrCodeParams,
  ValidateQrCodeResponse,
} from "@workspace/api-zod";

const router = Router();

function parseQr(qr: any) {
  return { ...qr };
}

router.post("/events/:eventId/qr-code", requireAuth, async (req, res): Promise<void> => {
  const params = GenerateQrCodeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const clerkId = getClerkUserId(req)!;
  const user = await getOrCreateUser(clerkId);

  const [event] = await db.select().from(eventsTable).where(eq(eventsTable.id, params.data.eventId));
  if (!event || event.hostId !== user.id) {
    res.status(404).json({ error: "Event not found or not authorized" });
    return;
  }

  if (!event.vendorConfirmed) {
    res.status(400).json({ error: "Vendor must confirm before generating QR code" });
    return;
  }

  // Check if QR code already exists
  const [existing] = await db.select().from(qrCodesTable).where(eq(qrCodesTable.eventId, params.data.eventId));
  if (existing && existing.status === "active") {
    res.status(201).json(parseQr(existing));
    return;
  }

  const token = uuidv4();
  const domain = process.env.REPLIT_DOMAINS?.split(",")[0] || "localhost";
  const qrUrl = `https://${domain}/tip/${token}`;
  const qrCodeDataUrl = await QRCode.toDataURL(qrUrl, { width: 400 });

  const [qrCode] = await db.insert(qrCodesTable).values({
    id: uuidv4(),
    eventId: event.id,
    token,
    qrCodeUrl: qrCodeDataUrl,
    status: "active",
    validFrom: event.startTime,
    validUntil: event.endTime,
    scanCount: 0,
  }).returning();

  // Update event status to active
  await db.update(eventsTable).set({ status: "active" }).where(eq(eventsTable.id, event.id));

  res.status(201).json(parseQr(qrCode));
});

router.get("/events/:eventId/qr-code", requireAuth, async (req, res): Promise<void> => {
  const params = GetEventQrCodeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [qrCode] = await db.select().from(qrCodesTable).where(eq(qrCodesTable.eventId, params.data.eventId));
  if (!qrCode) {
    res.status(404).json({ error: "QR code not found" });
    return;
  }

  res.json(GetEventQrCodeResponse.parse(parseQr(qrCode)));
});

router.post("/events/:eventId/revoke", requireAuth, async (req, res): Promise<void> => {
  const params = RevokeEventQrCodeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const clerkId = getClerkUserId(req)!;
  const user = await getOrCreateUser(clerkId);

  const [event] = await db.select().from(eventsTable).where(eq(eventsTable.id, params.data.eventId));
  if (!event || event.hostId !== user.id) {
    res.status(404).json({ error: "Event not found or not authorized" });
    return;
  }

  const [qrCode] = await db.update(qrCodesTable)
    .set({ status: "revoked", updatedAt: new Date() })
    .where(eq(qrCodesTable.eventId, params.data.eventId))
    .returning();

  if (!qrCode) {
    res.status(404).json({ error: "QR code not found" });
    return;
  }

  res.json(RevokeEventQrCodeResponse.parse(parseQr(qrCode)));
});

// Public endpoint - validates QR token
router.get("/qr/validate/:token", async (req, res): Promise<void> => {
  const params = ValidateQrCodeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid token" });
    return;
  }

  const [qrCode] = await db.select().from(qrCodesTable).where(eq(qrCodesTable.token, params.data.token));
  if (!qrCode) {
    res.status(400).json({ valid: false, message: "QR code not found" });
    return;
  }

  const now = new Date();
  if (qrCode.status !== "active") {
    res.status(400).json({ valid: false, message: "QR code is not active" });
    return;
  }

  if (now < new Date(qrCode.validFrom) || now > new Date(qrCode.validUntil)) {
    res.status(400).json({ valid: false, message: "QR code is outside its valid time window" });
    return;
  }

  const [event] = await db.select().from(eventsTable).where(eq(eventsTable.id, qrCode.eventId));
  if (!event) {
    res.status(400).json({ valid: false, message: "Event not found" });
    return;
  }

  // Increment scan count
  await db.update(qrCodesTable).set({ scanCount: qrCode.scanCount + 1 }).where(eq(qrCodesTable.id, qrCode.id));

  res.json(ValidateQrCodeResponse.parse({
    valid: true,
    eventId: event.id,
    eventName: event.name,
    hostName: event.hostName,
    vendorName: event.vendorName ?? "Service Provider",
    venueName: event.venueName,
    eventType: event.eventType,
    perGuestCap: event.perGuestCap ? parseFloat(event.perGuestCap) : null,
    validUntil: qrCode.validUntil.toISOString(),
    message: `You're tipping at ${event.name}, hosted by ${event.hostName}, served by ${event.vendorName ?? "Service Provider"} — verified by TipEase`,
  }));
});

export default router;
