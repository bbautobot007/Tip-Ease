import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { v4 as uuidv4 } from "uuid";
import { requireAuth, getClerkUserId } from "../lib/auth";
import {
  GetMeResponse,
  UpdateMeBody,
  UpdateMeResponse,
  SetUserRoleBody,
  SetUserRoleResponse,
} from "@workspace/api-zod";

const router = Router();

// Helper to get or create user
async function getOrCreateUser(clerkId: string, email?: string, name?: string) {
  const [existing] = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId));
  if (existing) return existing;

  const [created] = await db.insert(usersTable).values({
    id: uuidv4(),
    clerkId,
    email: email || "",
    name: name || "TipEase User",
    limitTier: "standard",
    walletBalance: "0",
  }).returning();
  return created;
}

export { getOrCreateUser };

router.get("/users/me", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req)!;
  const user = await getOrCreateUser(clerkId);
  res.json(GetMeResponse.parse({
    ...user,
    walletBalance: parseFloat(user.walletBalance),
    phone: user.phone ?? null,
    stripeCustomerId: user.stripeCustomerId ?? null,
  }));
});

router.put("/users/me", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req)!;
  const parsed = UpdateMeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [user] = await db.update(usersTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(usersTable.clerkId, clerkId))
    .returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(UpdateMeResponse.parse({
    ...user,
    walletBalance: parseFloat(user.walletBalance),
    phone: user.phone ?? null,
    stripeCustomerId: user.stripeCustomerId ?? null,
  }));
});

router.post("/users/me/role", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req)!;
  const parsed = SetUserRoleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [user] = await db.update(usersTable)
    .set({ role: parsed.data.role, updatedAt: new Date() })
    .where(eq(usersTable.clerkId, clerkId))
    .returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(SetUserRoleResponse.parse({
    ...user,
    walletBalance: parseFloat(user.walletBalance),
    phone: user.phone ?? null,
    stripeCustomerId: user.stripeCustomerId ?? null,
  }));
});

export default router;
