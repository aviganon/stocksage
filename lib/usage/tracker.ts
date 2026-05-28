import { getAdminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

const FREE_REPORTS_PER_MONTH = 3;
const COLLECTION = 'users';

export interface UserProfile {
  uid: string;
  email: string | null;
  plan: 'free' | 'pro';
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  createdAt: string;
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

export async function canRunReport(uid: string): Promise<{ allowed: boolean; used: number; limit: number; plan: 'free' | 'pro' }> {
  const db = getAdminDb();
  const profile = await getUserProfile(uid);
  const plan = profile?.plan ?? 'free';

  if (plan === 'pro') return { allowed: true, used: 0, limit: Infinity, plan };

  const startOfMonth = new Date();
  startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);

  const snap = await db.collection('reports')
    .where('uid', '==', uid)
    .where('startedAt', '>=', startOfMonth.toISOString())
    .get();

  const used = snap.size;
  return { allowed: used < FREE_REPORTS_PER_MONTH, used, limit: FREE_REPORTS_PER_MONTH, plan };
}

export async function updateUserPlan(uid: string, plan: 'free' | 'pro', stripeData?: { customerId?: string; subscriptionId?: string }): Promise<void> {
  const db = getAdminDb();
  await db.collection(COLLECTION).doc(uid).update({
    plan,
    ...(stripeData?.customerId ? { stripeCustomerId: stripeData.customerId } : {}),
    ...(stripeData?.subscriptionId ? { stripeSubscriptionId: stripeData.subscriptionId } : {}),
    updatedAt: FieldValue.serverTimestamp(),
  });
}
