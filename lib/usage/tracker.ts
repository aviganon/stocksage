import { getAdminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

const FREE_REPORTS_PER_MONTH = 3;
const COLLECTION = 'users';

export interface Credits { standard: number; deep: number }

export const PRO_MONTHLY_CREDITS: Credits = { standard: 30, deep: 10 };

export interface UserProfile {
  uid: string;
  email: string | null;
  firstName?: string;
  lastName?: string;
  plan: 'free' | 'pro';
  credits?: Credits;
  creditsUsed?: Credits;
  proResetDate?: string;   // ISO — when credits were last reset
  paddleSubscriptionId?: string;
  createdAt: string;
  lastSeenAt?: string;
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const db = getAdminDb();
  const doc = await db.collection(COLLECTION).doc(uid).get();
  if (!doc.exists) return null;
  return doc.data() as UserProfile;
}

export async function ensureUserProfile(uid: string, email: string | null): Promise<UserProfile> {
  const db = getAdminDb();
  const ref = db.collection(COLLECTION).doc(uid);
  const snap = await ref.get();
  if (snap.exists) return snap.data() as UserProfile;

  const profile: UserProfile = { uid, email, plan: 'free', createdAt: new Date().toISOString() };
  await ref.set(profile);
  return profile;
}

export async function canRunReport(
  uid: string,
  depth: 'quick' | 'standard' | 'deep' = 'quick',
): Promise<{ allowed: boolean; used: number; limit: number; plan: 'free' | 'pro'; requiresPayment: boolean }> {
  const db = getAdminDb();
  const profile = await getUserProfile(uid);
  const plan = profile?.plan ?? 'free';

  // Quick depth is always free and unlimited for everyone
  if (depth === 'quick') {
    return { allowed: true, used: 0, limit: Infinity, plan, requiresPayment: false };
  }

  // Standard / Deep require a paid plan
  // Pro users have paid access; free users need to pay per report
  // (payment enforcement will be wired up when Paddle is configured)
  if (plan === 'pro') {
    return { allowed: true, used: 0, limit: Infinity, plan, requiresPayment: false };
  }

  // Free user requesting Standard/Deep — mark as requiring payment
  // For now during beta, allow it; when Paddle is ready this will redirect to checkout
  return { allowed: true, used: 0, limit: Infinity, plan, requiresPayment: true };
}

export async function updateUserPlan(uid: string, plan: 'free' | 'pro'): Promise<void> {
  const db = getAdminDb();
  await db.collection(COLLECTION).doc(uid).update({
    plan,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

export async function updateUserProfile(
  uid: string,
  data: { firstName?: string; lastName?: string },
): Promise<void> {
  const db = getAdminDb();
  await db.collection(COLLECTION).doc(uid).update({
    ...data,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

/** Check if user has a free credit for this depth. Returns remaining count. */
export async function getCreditsRemaining(uid: string, depth: 'standard' | 'deep'): Promise<number> {
  const profile = await getUserProfile(uid);
  return profile?.credits?.[depth] ?? 0;
}

/** Consume one credit. Returns true if credit was available and consumed. */
export async function consumeCredit(uid: string, depth: 'standard' | 'deep'): Promise<boolean> {
  const db = getAdminDb();
  const ref = db.collection(COLLECTION).doc(uid);
  let consumed = false;
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return;
    const current = (snap.data()?.credits?.[depth] ?? 0) as number;
    if (current <= 0) return;
    tx.update(ref, {
      [`credits.${depth}`]:     FieldValue.increment(-1),
      [`creditsUsed.${depth}`]: FieldValue.increment(1),
    });
    consumed = true;
  });
  return consumed;
}

/**
 * Activate Pro plan + grant monthly credits.
 * Called when Paddle subscription activates or renews.
 */
export async function activateProCredits(uid: string, subscriptionId?: string): Promise<void> {
  const db = getAdminDb();
  const now = new Date().toISOString();
  await db.collection(COLLECTION).doc(uid).update({
    plan:               'pro',
    'credits.standard': PRO_MONTHLY_CREDITS.standard,
    'credits.deep':     PRO_MONTHLY_CREDITS.deep,
    'creditsUsed.standard': 0,
    'creditsUsed.deep':     0,
    proResetDate: now,
    ...(subscriptionId ? { paddleSubscriptionId: subscriptionId } : {}),
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Lazy monthly reset: if Pro user's credits are from a previous month, reset them.
 * Called on every /api/user GET so credits stay current.
 */
export async function checkAndResetProCredits(uid: string): Promise<void> {
  const profile = await getUserProfile(uid);
  if (!profile || profile.plan !== 'pro' || !profile.proResetDate) return;

  const lastReset = new Date(profile.proResetDate);
  const now       = new Date();
  const newMonth  = now.getFullYear() > lastReset.getFullYear()
    || now.getMonth() > lastReset.getMonth();

  if (!newMonth) return;

  // New month — reset to full Pro credits
  const db = getAdminDb();
  await db.collection(COLLECTION).doc(uid).update({
    'credits.standard':     PRO_MONTHLY_CREDITS.standard,
    'credits.deep':         PRO_MONTHLY_CREDITS.deep,
    'creditsUsed.standard': 0,
    'creditsUsed.deep':     0,
    proResetDate: now.toISOString(),
  });
}

/** Admin: set credits for a user (absolute value, not increment). */
export async function setCredits(uid: string, credits: Partial<Credits>): Promise<void> {
  const db = getAdminDb();
  const update: Record<string, unknown> = {};
  if (credits.standard !== undefined) update['credits.standard'] = credits.standard;
  if (credits.deep     !== undefined) update['credits.deep']     = credits.deep;
  if (Object.keys(update).length) {
    await db.collection(COLLECTION).doc(uid).update(update);
  }
}

export async function touchLastSeen(uid: string): Promise<void> {
  const db = getAdminDb();
  await db.collection(COLLECTION).doc(uid).update({
    lastSeenAt: new Date().toISOString(),
  }).catch(() => { /* ignore if doc doesn't exist yet */ });
}
