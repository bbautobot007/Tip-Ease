import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { db, usersTable, walletTransactionsTable } from "@workspace/db";
import { v4 as uuidv4 } from "uuid";
import { requireAuth, getClerkUserId } from "../lib/auth";
import { getOrCreateUser } from "./users";
import { getUncachableStripeClient, getStripePublishableKey } from "../lib/stripeClient";
import {
  GetWalletResponse,
  AddFundsToWalletBody,
  AddFundsToWalletResponse,
  GetWalletTransactionsResponse,
  GetDailyLimitResponse,
  GetStripePublishableKeyResponse,
} from "@workspace/api-zod";

const DAILY_LIMITS: Record<string, number> = {
  standard: 20,
  verified: 50,
  enhanced: 100,
  custom: 500,
};

const router = Router();

router.get("/stripe/publishable-key", async (_req, res): Promise<void> => {
  const publishableKey = await getStripePublishableKey();
  res.json(GetStripePublishableKeyResponse.parse({ publishableKey }));
});

router.get("/wallet", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req)!;
  const user = await getOrCreateUser(clerkId);
  const dailyLimit = DAILY_LIMITS[user.limitTier] || 20;

  // Reset daily usage if needed
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(23, 59, 59, 999);
  const lastReset = user.dailyResetAt ? new Date(user.dailyResetAt) : null;
  let dailyUsed = parseFloat(user.dailyUsed);

  if (!lastReset || lastReset.toDateString() !== now.toDateString()) {
    dailyUsed = 0;
    await db.update(usersTable).set({ dailyUsed: "0", dailyResetAt: now }).where(eq(usersTable.clerkId, clerkId));
  }

  res.json(GetWalletResponse.parse({
    balance: parseFloat(user.walletBalance),
    dailyLimit,
    dailyUsed,
    limitTier: user.limitTier as any,
    autoReload: user.autoReload,
    autoReloadAmount: user.autoReloadAmount ? parseFloat(user.autoReloadAmount) : null,
    autoReloadThreshold: user.autoReloadThreshold ? parseFloat(user.autoReloadThreshold) : null,
  }));
});

router.post("/wallet/add-funds", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req)!;
  const parsed = AddFundsToWalletBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const user = await getOrCreateUser(clerkId);
  const stripe = await getUncachableStripeClient();
  const publishableKey = await getStripePublishableKey();

  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({ email: user.email, name: user.name });
    customerId = customer.id;
    await db.update(usersTable).set({ stripeCustomerId: customerId }).where(eq(usersTable.clerkId, clerkId));
  }

  const amountCents = Math.round(parsed.data.amount * 100);
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountCents,
    currency: "usd",
    customer: customerId,
    metadata: { userId: user.id, clerkId, type: "wallet_deposit" },
  });

  res.json(AddFundsToWalletResponse.parse({
    clientSecret: paymentIntent.client_secret!,
    publishableKey,
    amount: parsed.data.amount,
  }));
});

router.get("/wallet/transactions", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req)!;
  const user = await getOrCreateUser(clerkId);

  const txns = await db.select().from(walletTransactionsTable)
    .where(eq(walletTransactionsTable.userId, user.id))
    .orderBy(desc(walletTransactionsTable.createdAt))
    .limit(50);

  res.json(GetWalletTransactionsResponse.parse(txns.map(t => ({
    ...t,
    amount: parseFloat(t.amount),
  }))));
});

router.get("/wallet/daily-limit", requireAuth, async (req, res): Promise<void> => {
  const clerkId = getClerkUserId(req)!;
  const user = await getOrCreateUser(clerkId);
  const dailyLimit = DAILY_LIMITS[user.limitTier] || 20;
  const dailyUsed = parseFloat(user.dailyUsed);

  const now = new Date();
  const resetsAt = new Date(now);
  resetsAt.setHours(23, 59, 59, 999);

  res.json(GetDailyLimitResponse.parse({
    tier: user.limitTier as any,
    dailyLimit,
    used: dailyUsed,
    remaining: Math.max(0, dailyLimit - dailyUsed),
    resetsAt: resetsAt.toISOString(),
  }));
});

export { DAILY_LIMITS };
export default router;
