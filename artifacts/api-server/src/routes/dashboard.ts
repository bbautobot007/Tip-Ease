import { Router } from "express";
import { eq, and, gte, desc, count } from "drizzle-orm";
import { db, usersTable, eventsTable, tipsTable, vendorsTable, notificationsTable } from "@workspace/db";
import { requireAuth, getClerkUserId } from "../lib/auth";
import { getOrCreateUser } from "./users";
import { DAILY_LIMITS } from "./wallet";
import {
  GetGuestDashboardResponse,
  GetHostDashboardResponse,
  GetVendorDashboardResponse,
} from "@workspace/api-zod";

const router = Router();

function parseTip(t: any) {
  return { ...t, amount: parseFloat(t.amount) };
}

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

router.get("/dashboard/guest", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req)!;
  const user = await getOrCreateUser(clerkId);
  const dailyLimit = DAILY_LIMITS[user.limitTier] || 20;

  const now = new Date();
  let dailyUsed = parseFloat(user.dailyUsed);
  if (!user.dailyResetAt || new Date(user.dailyResetAt).toDateString() !== now.toDateString()) {
    dailyUsed = 0;
  }

  const recentTips = await db.select().from(tipsTable)
    .where(eq(tipsTable.guestId, user.id))
    .orderBy(desc(tipsTable.createdAt))
    .limit(5);

  const allTips = await db.select().from(tipsTable).where(eq(tipsTable.guestId, user.id));
  const totalTipsSent = allTips.reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const unreadNotifs = await db.select().from(notificationsTable)
    .where(and(eq(notificationsTable.userId, user.id), eq(notificationsTable.read, false)));

  res.json(GetGuestDashboardResponse.parse({
    walletBalance: parseFloat(user.walletBalance),
    dailyUsed,
    dailyLimit,
    dailyRemaining: Math.max(0, dailyLimit - dailyUsed),
    totalTipsSent,
    tipCount: allTips.length,
    recentTips: recentTips.map(parseTip),
    unreadNotifications: unreadNotifs.length,
  }));
});

router.get("/dashboard/host", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req)!;
  const user = await getOrCreateUser(clerkId);

  const events = await db.select().from(eventsTable).where(eq(eventsTable.hostId, user.id));
  const activeEvents = events.filter(e => e.status === "active").length;
  const pendingConfirmations = events.filter(e => e.status === "pending_vendor").length;
  const totalTipsGenerated = events.reduce((sum, e) => sum + parseFloat(e.totalTips), 0);

  const recentEvents = await db.select().from(eventsTable)
    .where(eq(eventsTable.hostId, user.id))
    .orderBy(desc(eventsTable.createdAt))
    .limit(5);

  const unreadNotifs = await db.select().from(notificationsTable)
    .where(and(eq(notificationsTable.userId, user.id), eq(notificationsTable.read, false)));

  res.json(GetHostDashboardResponse.parse({
    totalEvents: events.length,
    activeEvents,
    totalTipsGenerated,
    recentEvents: recentEvents.map(parseEvent),
    pendingVendorConfirmations: pendingConfirmations,
    unreadNotifications: unreadNotifs.length,
  }));
});

router.get("/dashboard/vendor", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req)!;
  const user = await getOrCreateUser(clerkId);

  const [vendor] = await db.select().from(vendorsTable).where(eq(vendorsTable.userId, user.id));

  if (!vendor) {
    res.json(GetVendorDashboardResponse.parse({
      totalEarnings: 0,
      pendingPayouts: 0,
      todayEarnings: 0,
      totalEvents: 0,
      pendingEvents: 0,
      recentTips: [],
      rating: null,
      unreadNotifications: 0,
    }));
    return;
  }

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const recentTips = await db.select().from(tipsTable)
    .where(eq(tipsTable.vendorId, vendor.id))
    .orderBy(desc(tipsTable.createdAt))
    .limit(10);

  const todayTips = await db.select().from(tipsTable)
    .where(and(eq(tipsTable.vendorId, vendor.id), gte(tipsTable.createdAt, startOfDay)));

  const todayEarnings = todayTips.reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const pendingEvents = (await db.select().from(eventsTable).where(and(eq(eventsTable.vendorId, vendor.id), eq(eventsTable.status, "pending_vendor")))).length;

  const unreadNotifs = await db.select().from(notificationsTable)
    .where(and(eq(notificationsTable.userId, user.id), eq(notificationsTable.read, false)));

  res.json(GetVendorDashboardResponse.parse({
    totalEarnings: parseFloat(vendor.totalEarnings),
    pendingPayouts: parseFloat(vendor.pendingPayouts),
    todayEarnings,
    totalEvents: vendor.totalEvents,
    pendingEvents,
    recentTips: recentTips.map(parseTip),
    rating: vendor.rating ? parseFloat(vendor.rating) : null,
    unreadNotifications: unreadNotifs.length,
  }));
});

export default router;
