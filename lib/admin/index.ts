import { verifyAuth, AuthError } from '@/lib/auth/server';

export { AuthError };

const OWNER_EMAIL = process.env.ADMIN_EMAIL ?? 'galfainbur@gmail.com';

export async function verifyAdmin(): Promise<{ uid: string; email: string }> {
  const { uid, email } = await verifyAuth();
  if (email !== OWNER_EMAIL) {
    throw new AuthError('forbidden', 'Admin access required');
  }
  return { uid, email: email! };
}
