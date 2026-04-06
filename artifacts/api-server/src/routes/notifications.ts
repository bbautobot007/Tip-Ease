import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { db, notificationsTable } from "@workspace/db";
import { requireAuth, getClerkUserId } from "../lib/auth";
import { getOrCreateUser } from "./users";
import {
  ListNotificationsResponse,
  MarkNotificationReadParams,
  MarkNotificationReadResponse,
} from "@workspace/api-zod";

const router = Router();

router.get("/notifications", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req)!;
  const user = await getOrCreateUser(clerkId);

  const notifications = await db.select().from(notificationsTable)
    .where(eq(notificationsTable.userId, user.id))
    .orderBy(desc(notificationsTable.createdAt))
    .limit(30);

  res.json(ListNotificationsResponse.parse(notifications));
});

router.post("/notifications/:notificationId/read", requireAuth, async (req, res): Promise<void> => {
  const params = MarkNotificationReadParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const clerkId = getClerkUserId(req)!;
  const user = await getOrCreateUser(clerkId);

  const [notification] = await db.update(notificationsTable)
    .set({ read: true })
    .where(eq(notificationsTable.id, params.data.notificationId))
    .returning();

  if (!notification || notification.userId !== user.id) {
    res.status(404).json({ error: "Notification not found" });
    return;
  }

  res.json(MarkNotificationReadResponse.parse(notification));
});

export default router;
