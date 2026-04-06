import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { db, usersTable, eventsTable, vendorsTable, tipsTable, notificationsTable, walletTransactionsTable, qrCodesTable } from "@workspace/db";
import { v4 as uuidv4 } from "uuid";
import { requireAuth, getClerkUserId } from "../lib/auth";
import { getOrCreateUser } from "./users";
import { DAILY_LIMITS } from "./wallet";
import {
  SendTipBody,
  GetTipHistoryResponse,
  GetEventTipsParams,
  GetEventTipsResponse,
} from "@workspace/api-zod";

const router = Router();

function parseTip(t: any) {
  return { ...t, amount: parseFloat(t.amount) };
}

router.post("/tips", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req)!;
  const user = await getOrCreateUser(clerkId);
  const parsed = SendTipBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { eventId, qrToken, amount } = parsed.data;

  // Validate QR token
  const [qrCode] = await db.select().from(qrCodesTable).where(eq(qrCodesTable.token, qrToken));
  if (!qrCode || qrCode.status !== "active" || qrCode.eventId !== eventId) {
    res.status(400).json({ error: "Invalid or expired QR code" });
    return;
  }

  // Get event
  const [event] = await db.select().from(eventsTable).where(eq(eventsTable.id, eventId));
  if (!event || event.status !== "active") {
    res.status(400).json({ error: "Event is not active" });
    return;
  }

  // Check per-guest cap
  if (event.perGuestCap && amount > parseFloat(event.perGuestCap)) {
    res.status(400).json({ error: `Tip exceeds per-guest cap of $${event.perGuestCap}` });
    return;
  }

  // Check daily limit
  const dailyLimit = DAILY_LIMITS[user.limitTier] || 20;
  const now = new Date();
  let dailyUsed = parseFloat(user.dailyUsed);

  if (!user.dailyResetAt || new Date(user.dailyResetAt).toDateString() !== now.toDateString()) {
    dailyUsed = 0;
  }

  if (dailyUsed + amount > dailyLimit) {
    res.status(400).json({ error: `Daily limit of $${dailyLimit} would be exceeded` });
    return;
  }

  // Check wallet balance
  const balance = parseFloat(user.walletBalance);
  if (balance < amount) {
    res.status(400).json({ error: "Insufficient wallet balance" });
    return;
  }

  // Get vendor
  const [vendor] = await db.select().from(vendorsTable).where(eq(vendorsTable.id, event.vendorId!));
  if (!vendor) {
    res.status(400).json({ error: "Vendor not found" });
    return;
  }

  // Deduct from guest wallet
  const newBalance = balance - amount;
  const newDailyUsed = dailyUsed + amount;
  await db.update(usersTable).set({
    walletBalance: newBalance.toFixed(2),
    dailyUsed: newDailyUsed.toFixed(2),
    dailyResetAt: now,
  }).where(eq(usersTable.clerkId, clerkId));

  // Add to vendor earnings
  const vendorEarnings = parseFloat(vendor.totalEarnings) + amount;
  const vendorPending = parseFloat(vendor.pendingPayouts) + amount;
  await db.update(vendorsTable).set({
    totalEarnings: vendorEarnings.toFixed(2),
    pendingPayouts: vendorPending.toFixed(2),
    totalEvents: vendor.totalEvents,
  }).where(eq(vendorsTable.id, vendor.id));

  // Update event totals
  const eventTips = parseFloat(event.totalTips) + amount;
  await db.update(eventsTable).set({
    totalTips: eventTips.toFixed(2),
    tipCount: event.tipCount + 1,
  }).where(eq(eventsTable.id, eventId));

  // Create tip record
  const [tip] = await db.insert(tipsTable).values({
    id: uuidv4(),
    eventId,
    guestId: user.id,
    vendorId: vendor.id,
    amount: amount.toFixed(2),
    eventName: event.name,
    vendorName: vendor.companyName,
    status: "completed",
  }).returning();

  // Record wallet transaction
  await db.insert(walletTransactionsTable).values({
    userId: user.id,
    type: "tip",
    amount: (-amount).toFixed(2),
    description: `Tip at ${event.name} — ${vendor.companyName}`,
  });

  // Notifications
  await db.insert(notificationsTable).values({
    userId: user.id,
    type: "tip_sent",
    message: `Your $${amount.toFixed(2)} tip was sent to ${vendor.companyName} at ${event.name}!`,
    read: false,
  });

  await db.insert(notificationsTable).values({
    userId: vendor.userId,
    type: "tip_received",
    message: `New tip received: $${amount.toFixed(2)} from a guest at ${event.name}`,
    read: false,
  });

  // Low balance notification
  if (newBalance < 5) {
    await db.insert(notificationsTable).values({
      userId: user.id,
      type: "low_balance",
      message: `Your wallet balance is below $5 — tap to add funds`,
      read: false,
    });
  }

  res.status(201).json(parseTip(tip));
});

router.get("/tips/history", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req)!;
  const user = await getOrCreateUser(clerkId);

  const tips = await db.select().from(tipsTable)
    .where(eq(tipsTable.guestId, user.id))
    .orderBy(desc(tipsTable.createdAt))
    .limit(50);

  res.json(GetTipHistoryResponse.parse(tips.map(parseTip)));
});

router.get("/events/:eventId/tips", requireAuth, async (req, res): Promise<void> => {
  const params = GetEventTipsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const tips = await db.select().from(tipsTable)
    .where(eq(tipsTable.eventId, params.data.eventId))
    .orderBy(desc(tipsTable.createdAt));

  res.json(GetEventTipsResponse.parse(tips.map(parseTip)));
});

export default router;
